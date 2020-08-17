import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import { Checkpoint, Export } from "../schema/__generated__/graphql";
import { Container } from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";
import { Project } from "../store";

const CONTAINER_MOUNT_PATH = "/opt/ml/model";
const DATASET_IMAGE = "gcperkins/wpilib-ml-dataset:latest";
const TRAIN_IMAGE = "gcperkins/wpilib-ml-train:latest";
const METRICS_IMAGE = "gcperkins/wpilib-ml-metrics:latest";
const EXPORT_IMAGE = "gcperkins/wpilib-ml-tflite:latest";
const TEST_IMAGE = "gcperkins/wpilib-ml-test:latest";

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
    await this.pull(DATASET_IMAGE);
    await this.pull(TRAIN_IMAGE);
    await this.pull(METRICS_IMAGE);
    this.trainReady = true;

    await this.pull(EXPORT_IMAGE);
    this.exportReady = true;

    await this.pull(TEST_IMAGE);
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
      const PROJECTDIR = `${PROJECT_DATA_DIR}/${projectID}`.replace(/\\/g, "/");
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
      const MOUNT = `${PROJECT_DATA_DIR}/${project.id}`.replace(/\\/g, "/");
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
      const ID = project.id;
      const MOUNT = this.projects[ID].directory;
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

      //custom checkpoints not yet supported by gui
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

      if (fs.existsSync(path.posix.join(MOUNT, "metrics.json"))) {
        await fs.promises.unlink(path.posix.join(MOUNT, "metrics.json"));
      }
      this.projects[ID].checkpoints = {}; //must add a way to preserve existing checkpoints somehow

      this.projects[ID].containers.metrics = await this.createContainer(METRICS_IMAGE, "METRICS-", ID, MOUNT, "6006");
      await this.projects[ID].containers.metrics.start();

      this.projects[ID].containers.train = await this.createContainer(DATASET_IMAGE, "TRAIN-", ID, MOUNT);
      await this.projects[ID].containers.train.start();
      await this.projects[ID].containers.train.wait();
      await this.projects[ID].containers.train.remove();

      this.projects[ID].containers.train = await this.createContainer(TRAIN_IMAGE, "TRAIN-", ID, MOUNT);
      await this.projects[ID].containers.train.start();
      await this.projects[ID].containers.train.wait();
      await this.projects[ID].containers.train.remove();

      this.projects[ID].containers.train = null;
      return "training complete";
    } catch (err) {
      Promise.reject(err);
    }
  }

  private async createContainer(
    image: string,
    tag: string,
    id: string,
    mount: string,
    port: string = null
  ): Promise<Container> {
    const NAME = tag + id;

    let MOUNTCMD = process.cwd().replace("C:\\", "/c/").replace(/\\/g, "/");
    MOUNTCMD = path.posix.join(MOUNTCMD, mount);
    MOUNTCMD = `${MOUNTCMD}:${CONTAINER_MOUNT_PATH}:rw`;

    const options = {
      Image: image,
      name: NAME,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      Tty: true,
      Volumes: { [CONTAINER_MOUNT_PATH]: {} },
      HostConfig: { Binds: [MOUNTCMD] }
    };
    if (port) {
      const PORTCMD = `${port}/tcp`;
      options["ExposedPorts"] = { [PORTCMD]: {} };
      options.HostConfig["PortBindings"] = { [PORTCMD]: [{ HostPort: port }] };
    }

    await this.deleteContainer(NAME);
    const container = await this.docker.createContainer(options);
    (await container.attach({ stream: true, stdout: true, stderr: true })).pipe(process.stdout);

    return container;
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const MOUNT = this.projects[id].directory;
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
      "export-dir": `exports/${name}`
    };
    fs.writeFileSync(path.posix.join(MOUNT, "exportparameters.json"), JSON.stringify(exportparameters));

    this.projects[id].containers.export = await this.createContainer(EXPORT_IMAGE, "EXPORT-", id, MOUNT);
    await this.projects[id].containers.export.start();
    await this.projects[id].containers.export.wait();
    await this.projects[id].containers.export.remove();
    this.projects[id].containers.export = null;

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
    const ID = modelExport.projectId;
    const MOUNT = this.projects[ID].directory;

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

    this.projects[ID].containers.test = await this.createContainer(TEST_IMAGE, "TEST-", ID, MOUNT, "5000");
    await this.projects[ID].containers.test.start();
    await this.projects[ID].containers.test.wait();
    await this.projects[ID].containers.test.remove();

    this.projects[ID].containers.test = null;
    return "testing complete";
  }

  halt(id: string): void {
    console.log("halt");
  }

  private async deleteContainer(name: string): Promise<void> {
    const container: Container = await new Promise((resolve) => {
      const opts = {
        limit: 1,
        filters: `{"name": ["${name}"]}`
      };
      this.docker.listContainers(opts, (err, containers) => {
        resolve(containers.length > 0 ? this.docker.getContainer(containers[0].Id) : null);
      });
    });

    if (container) {
      if ((await container.inspect()).State.Running) {
        await container.kill({ force: true });
      }
      await container.remove();
    }
    Promise.resolve();
  }

  async getProjectCheckpoints(id: string): Promise<Checkpoint[]> {
    return new Promise((resolve, reject) => {
      const METRICSPATH = path.posix.join(this.projects[id].directory, "metrics.json");
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
}
