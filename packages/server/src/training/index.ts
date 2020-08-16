import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import { Checkpoint, Export } from "../schema/__generated__/graphql";
import { Container } from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";
import { Project } from "../store";

const CONTAINER_MOUNT_PATH = "/opt/ml/model";

type TrainParameters = {
  name: string;
  epochs: number;
  "batch-size": number;
  "eval-frequency": number;
  "dataset-path": string;
  "percent-eval": number;
  checkpoint: string;
};

type ProjectData = {
  [id: string]: {
    directory: string;
    checkpoints: { [step: string]: Checkpoint };
    exports: { [id: string]: Export };
    containers: {
      tflite: Container;
      train: Container;
      metrics: Container;
      export: Container;
      test: Container;
    };
  };
};

export default class Trainer {
  trainReady: boolean;
  exportReady: boolean;
  testReady: boolean;
  projects: ProjectData;

  readonly docker = new Dockerode();

  constructor() {
    this.projects = this.scanProjects();

    this.trainReady = false;
    this.exportReady = false;
    this.testReady = false;
    this.pullImages();

    console.log(this.projects);
  }

  private async pullImages(): Promise<void> {
    await this.pull("gcperkins/wpilib-ml-dataset:latest");
    await this.pull("gcperkins/wpilib-ml-train:latest");
    await this.pull("gcperkins/wpilib-ml-metrics:latest");
    this.trainReady = true;

    await this.pull("gcperkins/wpilib-ml-tflite:latest");
    this.exportReady = true;

    await this.pull("gcperkins/wpilib-ml-test:latest");
    this.testReady = true;

    console.log("image pull complete");
    Promise.resolve();
  }

  private async pull(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.docker.pull(name, (err: string, stream: { pipe: (arg0: NodeJS.WriteStream) => void }) => {
        stream.pipe(process.stdout);
        this.docker.modem.followProgress(stream, onFinished);
        function onFinished(err: string, output: string) {
          if (!err) {
            resolve(output);
          } else {
            console.log(err);
            reject(err);
          }
        }
      });
    });
  }

  scanProjects(): ProjectData {
    const projects = {};

    fs.readdirSync(PROJECT_DATA_DIR).forEach(pushProject);
    function pushProject(projectID) {
      const PROJECTDIR = `${PROJECT_DATA_DIR}/${projectID}/mount`.replace(/\\/g, "/");
      const EXPORTSDIR = path.posix.join(PROJECTDIR, "exports");

      projects[projectID] = {
        directory: PROJECTDIR,
        checkpoints: {},
        exports: {},
        containers: {
          tflite: null,
          train: null,
          metrics: null,
          export: null,
          test: null
        }
      };

      fs.readdirSync(EXPORTSDIR).forEach(pushExport);
      function pushExport(exportID) {
        const EXPORT_DIR = path.posix.join(EXPORTSDIR, exportID);
        const TARFILENAME = fs.readdirSync(EXPORT_DIR).find((thing) => thing.includes(".tar.gz"));

        if (TARFILENAME) {
          const TARFILEPATH = path.posix.join(EXPORT_DIR, TARFILENAME);
          const NAME = TARFILENAME.replace(".tar.gz", "");

          projects[projectID].exports[exportID] = {
            projectId: projectID,
            name: NAME,
            directory: EXPORT_DIR,
            tarPath: TARFILEPATH
          };
        }
      }
    }

    return projects;
  }

  addProjectData(project: Project): void {
    if (!(project.id in this.projects)) {
      const MOUNT = Trainer.getMountPath(project.id);
      mkdirp(MOUNT)
        .then(() => fs.mkdirSync(path.posix.join(MOUNT, "dataset")))
        .then(() => fs.mkdirSync(path.posix.join(MOUNT, "exports")));
      this.projects[project.id] = {
        directory: MOUNT,
        checkpoints: {},
        exports: {},
        containers: {
          tflite: null,
          train: null,
          metrics: null,
          export: null,
          test: null
        }
      };
    }
  }

  async start(project: Project): Promise<string> {
    const dataset = (await project.getDatasets())[0];
    if (!dataset) {
      Promise.reject("there is no dataset. How am I supposed to train with no dataset?");
    }
    try {
      const MOUNT = this.projects[project.id].directory;
      const MOUNTCMD = Trainer.getMountCmd(MOUNT, CONTAINER_MOUNT_PATH);
      const DATASETPATH = path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path));
      const INITCKPT =
        project.initialCheckpoint !== "default"
          ? path.posix.join("checkpoints", project.initialCheckpoint)
          : project.initialCheckpoint;

      const trainParameters: TrainParameters = {
        name: project.name,
        epochs: project.epochs,
        checkpoint: INITCKPT,
        "batch-size": project.batchSize,
        "dataset-path": DATASETPATH,
        "eval-frequency": project.evalFrequency,
        "percent-eval": project.percentEval
      };
      await fs.promises.writeFile(path.posix.join(MOUNT, "hyperparameters.json"), JSON.stringify(trainParameters));

      await fs.promises.copyFile(
        path.posix.join("data", dataset.path),
        path.posix.join(MOUNT, "dataset", path.basename(dataset.path))
      );
      console.log(`copied dataset to mount`);

      //currently not supported by gui
      if (project.initialCheckpoint != "default") {
        if (!fs.existsSync(path.posix.join(MOUNT, "checkpoints"))) {
          await mkdirp(path.posix.join(MOUNT, "checkpoints"));
        }
        await Promise.all([
          fs.promises.copyFile(
            path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(".data-00000-of-00001")),
            path.posix.join(MOUNT, "checkpoints", project.initialCheckpoint.concat(".data-00000-of-00001"))
          ),
          fs.promises.copyFile(
            path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(".index")),
            path.posix.join(MOUNT, "checkpoints", project.initialCheckpoint.concat(".index"))
          ),
          fs.promises.copyFile(
            path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(".meta")),
            path.posix.join(MOUNT, "checkpoints", project.initialCheckpoint.concat(".meta"))
          )
        ]);
      }

      await this.deleteContainer(project.id);
      await this.deleteContainer("metrics");

      this.projects[project.id].containers.metrics = await this.docker.createContainer({
        Image: "gcperkins/wpilib-ml-metrics",
        name: "metrics",
        Volumes: { [CONTAINER_MOUNT_PATH]: {} },
        HostConfig: { Binds: [MOUNTCMD] }
      });
      this.projects[project.id].containers.metrics.start();

      await this.runContainer("gcperkins/wpilib-ml-dataset", project.id, MOUNTCMD, "dataset ready. Training...");

      await this.runContainer("gcperkins/wpilib-ml-train", project.id, MOUNTCMD, "training finished");

      return "training complete";
    } catch (err) {
      Promise.reject(err);
    }
  }

  private async runContainer(image: string, id: string, mount: string, message: string): Promise<string> {
    const options = {
      Image: image,
      name: id,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      Tty: true,
      Volumes: { [CONTAINER_MOUNT_PATH]: {} },
      ExposedPorts: { "5000/tcp": {} },
      HostConfig: {
        Binds: [mount],
        PortBindings: { "5000/tcp": [{ HostPort: "5000" }] }
      }
    };

    ////////////////////////////////////
    //CHANGE THIS
    ////////////////////////////////////

    this.projects[id].containers.train = await this.docker.createContainer(options);

    (await this.projects[id].containers.train.attach({ stream: true, stdout: true, stderr: true })).pipe(
      process.stdout
    );

    await this.projects[id].containers.train.start();

    await this.projects[id].containers.train.wait();

    await this.projects[id].containers.train.remove();

    console.log(message);
    return message;
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const MOUNT = this.projects[id].directory;
    const MOUNTCMD = Trainer.getMountCmd(MOUNT, CONTAINER_MOUNT_PATH);
    const CHECKPOINT_TAG = `model.ckpt-${checkpointNumber}`;
    const EXPORT_PATH = path.posix.join(MOUNT, "exports", name);
    const TAR_PATH = path.posix.join(EXPORT_PATH, `${name}.tar.gz`);

    if (!fs.existsSync(path.posix.join(MOUNT, "train", `${CHECKPOINT_TAG}.meta`))) {
      Promise.reject("cannot find requested checkpoint");
    }

    await mkdirp(path.posix.join(EXPORT_PATH, "checkpoint"));

    await Promise.all([
      fs.promises.copyFile(
        path.posix.join(MOUNT, "train", `${CHECKPOINT_TAG}.meta`),
        path.posix.join(EXPORT_PATH, "checkpoint", `${CHECKPOINT_TAG}.meta`)
      ),
      fs.promises.copyFile(
        path.posix.join(MOUNT, "train", `${CHECKPOINT_TAG}.index`),
        path.posix.join(EXPORT_PATH, "checkpoint", `${CHECKPOINT_TAG}.index`)
      ),
      fs.promises.copyFile(
        path.posix.join(MOUNT, "train", `${CHECKPOINT_TAG}.data-00000-of-00001`),
        path.posix.join(EXPORT_PATH, "checkpoint", `${CHECKPOINT_TAG}.data-00000-of-00001`)
      )
    ]);

    await this.getProjectCheckpoints(id); // <-- get rid of soon
    this.projects[id].checkpoints[checkpointNumber].status.exporting = true;

    const exportparameters = {
      name: name,
      epochs: checkpointNumber,
      "export-dir": path.posix.join("exports", name)
    };
    fs.writeFileSync(path.posix.join(MOUNT, "exportparameters.json"), JSON.stringify(exportparameters));

    await this.deleteContainer(id);
    await this.runContainer("gcperkins/wpilib-ml-tflite", id, MOUNTCMD, "tflite conversion complete");

    this.projects[id].exports[name] = {
      projectId: id,
      name: name,
      directory: EXPORT_PATH,
      tarPath: TAR_PATH
    };
    this.projects[id].checkpoints[checkpointNumber].status.exportPaths.push(EXPORT_PATH);
    this.projects[id].checkpoints[checkpointNumber].status.exporting = false;

    return "exported";
  }

  async test(modelExport: Export, videoPath: string, videoFilename: string, videoCustomName: string): Promise<string> {
    const MOUNT = this.projects[modelExport.projectId].directory;
    const MOUNTCMD = Trainer.getMountCmd(MOUNT, CONTAINER_MOUNT_PATH);

    const MOUNTED_MODEL_PATH = path.posix.join(MOUNT, "exports", modelExport.name, `${modelExport.name}.tar.gz`);
    const CONTAINER_MODEL_PATH = path.posix.join(
      CONTAINER_MOUNT_PATH,
      "exports",
      modelExport.name,
      `${modelExport.name}.tar.gz`
    );

    const MOUNTED_VIDEO_PATH = path.posix.join(MOUNT, "videos", videoFilename);
    const CONTAINER_VIDEO_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "videos", videoFilename);

    if (!fs.existsSync(modelExport.tarPath)) {
      Promise.reject("model not found");
    }
    if (!fs.existsSync(videoPath)) {
      Promise.reject("video not found");
    }
    if (!fs.existsSync(MOUNTED_MODEL_PATH)) {
      await fs.promises.copyFile(modelExport.tarPath, MOUNTED_MODEL_PATH);
    }
    if (!fs.existsSync(MOUNTED_VIDEO_PATH)) {
      await fs.promises.copyFile(videoPath, MOUNTED_VIDEO_PATH);
    }
    const testparameters = {
      "test-video": CONTAINER_VIDEO_PATH,
      "model-tar": CONTAINER_MODEL_PATH
    };
    fs.writeFileSync(path.posix.join(MOUNT, "testparameters.json"), JSON.stringify(testparameters));
    await this.deleteContainer(modelExport.projectId);
    return this.runContainer("gcperkins/wpilib-ml-test", modelExport.projectId, MOUNTCMD, "test complete");
  }

  halt(id: string): void {
    this.deleteContainer(id)
      .then((message) => {
        console.log(message);
        return this.deleteContainer("metrics");
      })
      .then((message) => console.log(message))
      .catch((error) => console.log(error));
  }

  private async deleteContainer(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = this.docker;
      const opts = {
        limit: 1,
        filters: `{"name": ["${id}"]}`
      };
      this.docker.listContainers(opts, function (err, containers) {
        if (err) {
          reject(err);
        }
        if (!containers || containers.length == 0) {
          resolve(`no ${id} container yet`);
        } else {
          const container = docker.getContainer(containers[0].Id);
          container
            .kill({ force: true })
            .then(() => container.remove())
            .then(() => {
              console.log(`container ${id} killed`);
              resolve(`container ${id} killed`);
            })
            .catch(() => {
              container.remove().then(() => resolve(`container ${id} killed`));
            });
        }
      });
    });
  }

  async getProjectCheckpoints(id: string): Promise<Checkpoint[]> {
    return new Promise((resolve, reject) => {
      const METRICSPATH = path.posix.join(Trainer.getMountPath(id), "metrics.json");
      if (fs.existsSync(METRICSPATH)) {
        try {
          const data = fs.readFileSync(METRICSPATH, "utf8");
          const metrics = JSON.parse(data);
          while (Object.keys(metrics.precision).length > Object.keys(this.projects[id].checkpoints).length) {
            const step = Object.keys(metrics.precision)[Object.keys(this.projects[id].checkpoints).length];
            this.projects[id].checkpoints[step] = {
              step: parseInt(step, 10),
              metrics: {
                precision: metrics.precision[step],
                loss: null,
                intersectionOverUnion: null
              },
              status: {
                exporting: false,
                exportPaths: []
              }
            };
          }
        } catch (err) {
          reject(err);
          console.log("could not read metrics", err);
        }
      }
      resolve(Object.values(this.projects[id].checkpoints));
    });
  }

  async getProjectExports(id: string): Promise<Export[]> {
    exports = Object.values(this.projects[id].exports);
    return exports;
  }

  private static getMountPath(id: string): string {
    return `${PROJECT_DATA_DIR}/${id}/mount`.replace(/\\/g, "/");
  }

  private static getMountCmd(mount: string, containerMount: string): string {
    let mountcmd = process.cwd();
    if (mountcmd.includes(":\\")) {
      mountcmd = mountcmd.replace("C:\\", "/c/").replace(/\\/g, "/");
      console.log(mountcmd);
    }
    mountcmd = path.posix.join(mountcmd, mount);
    return `${mountcmd}:${containerMount}:rw`;
  }
}
