import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import { Project } from "../store";
import { Container } from "dockerode";
import * as Dockerode from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";
import { Checkpoint, Export, ProjectStatus } from "../schema/__generated__/graphql";

const DATASET_IMAGE = "gcperkins/wpilib-ml-dataset:latest";
const METRICS_IMAGE = "gcperkins/wpilib-ml-metrics:latest";
const EXPORT_IMAGE = "gcperkins/wpilib-ml-tflite:latest";
const TRAIN_IMAGE = "gcperkins/wpilib-ml-train:latest";
const TEST_IMAGE = "gcperkins/wpilib-ml-test:latest";
const CONTAINER_MOUNT_PATH = "/opt/ml/model";

//training state enumeration
const NOT_TRAINING = 0;
const PREPARING = 1;
const TRAINING = 2;
const PAUSED = 3;

type TrainParameters = {
  "eval-frequency": number;
  "dataset-path": string[];
  "percent-eval": number;
  "batch-size": number;
  checkpoint: string;
  epochs: number;
  name: string;
};

type ProjectData = {
  [id: string]: {
    checkpoints: { [step: string]: Checkpoint };
    exports: { [id: string]: Export };
    directory: string;
    containers: {
      tflite: Container;
      train: Container;
      metrics: Container;
      export: Container;
      test: Container;
    };
    status: ProjectStatus;
  };
};

export default class Trainer {
  projects: ProjectData;
  exportReady: boolean;
  trainReady: boolean;
  testReady: boolean;

  readonly docker = new Dockerode();

  constructor() {
    this.projects = this.scanProjects();

    this.exportReady = false;
    this.trainReady = false;
    this.testReady = false;
    this.pullImages();

    console.log(this.projects);
  }

  private async pullImages(): Promise<void> {
    await this.pull(DATASET_IMAGE);
    await this.pull(METRICS_IMAGE);
    await this.pull(TRAIN_IMAGE);
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
        try {
          stream.pipe(process.stdout);
          this.docker.modem.followProgress(stream, onFinished);
        } catch {
          console.log("cant pull image");
          resolve();
        }
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

      let EPOCHS = null;
      const HYPERPATH = path.posix.join(PROJECTDIR, "hyperparameters.json");
      if (fs.existsSync(HYPERPATH)) {
        const HYPERPARAMETERS = JSON.parse(fs.readFileSync(HYPERPATH, "utf8"));
        EPOCHS = HYPERPARAMETERS.epochs;
      }

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
        },
        status: {
          trainingState: NOT_TRAINING,
          currentEpoch: 0,
          lastEpoch: EPOCHS
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
            testingInProgress: false,
            directory: EXPORT_DIR,
            tarPath: TARFILEPATH,
            projectId: projectID,
            name: NAME
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
        },
        status: {
          trainingState: NOT_TRAINING,
          currentEpoch: 0,
          lastEpoch: project.epochs
        }
      };
    }
  }

  async start(project: Project): Promise<string> {
    const datasets = await project.getDatasets();
    if (!datasets) {
      Promise.reject("there are no datasets. How am I supposed to train with no datasets?");
      return;
    }

    const ID = project.id;
    this.projects[ID].status.trainingState = PREPARING;

    const MOUNT = this.projects[ID].directory;
    const DATASETPATHS = datasets.map((dataset) =>
      path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path))
    );
    const INITCKPT =
      project.initialCheckpoint !== "default"
        ? path.posix.join("checkpoints", project.initialCheckpoint)
        : project.initialCheckpoint;

    const trainParameters: TrainParameters = {
      "eval-frequency": project.evalFrequency,
      "percent-eval": project.percentEval,
      "batch-size": project.batchSize,
      "dataset-path": DATASETPATHS,
      epochs: project.epochs,
      checkpoint: INITCKPT,
      name: project.name
    };
    await fs.promises.writeFile(path.posix.join(MOUNT, "hyperparameters.json"), JSON.stringify(trainParameters));

    if (!this.projects[ID].status.trainingState) return "training stopped";
    this.projects[ID].containers.metrics = await this.createContainer(METRICS_IMAGE, "METRICS-", ID, MOUNT, "6006");
    const OLD_TRAIN_DIR = path.posix.join(MOUNT, "train");
    if (fs.existsSync(OLD_TRAIN_DIR)) {
      fs.rmdirSync(OLD_TRAIN_DIR, { recursive: true });
      console.log("old train dir removed");
    } //if this project has already trained, we must get rid of the evaluation files in order to only get new metrics
    const OLD_METRICS_DIR = path.posix.join(MOUNT, "metrics.json");
    if (fs.existsSync(OLD_METRICS_DIR)) {
      fs.unlinkSync(OLD_METRICS_DIR);
    } //must clear old checkpoints in order for new ones to be saved by trainer
    this.projects[ID].checkpoints = {}; //must add a way to preserve existing checkpoints somehow

    if (!this.projects[ID].status.trainingState) return "training stopped";
    datasets.forEach((dataset) => {
      fs.copyFileSync(
        path.posix.join("data", dataset.path),
        path.posix.join(MOUNT, "dataset", path.basename(dataset.path))
      );
    });
    console.log("datasets copied");

    //custom checkpoints not yet supported by gui
    if (!this.projects[ID].status.trainingState) return "training stopped";
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

    if (!this.projects[ID].status.trainingState) return "training stopped";
    console.log("extracting the dataset");
    this.projects[ID].containers.train = await this.createContainer(DATASET_IMAGE, "TRAIN-", ID, MOUNT);
    await this.projects[ID].containers.train.start();
    await this.projects[ID].containers.train.wait();
    await this.projects[ID].containers.train.remove();
    console.log("datasets extracted");

    if (!this.projects[ID].status.trainingState) return "training stopped";
    this.projects[ID].status.trainingState = TRAINING;
    this.projects[ID].status.currentEpoch = 0;
    this.projects[ID].containers.train = await this.createContainer(TRAIN_IMAGE, "TRAIN-", ID, MOUNT);
    await this.projects[ID].containers.metrics.start();
    await this.projects[ID].containers.train.start();
    await this.projects[ID].containers.train.wait();
    await this.projects[ID].containers.train.remove();

    this.projects[ID].status.trainingState = NOT_TRAINING;
    this.projects[ID].containers.train = null;
    return "training complete";
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const MOUNT = this.projects[id].directory;
    const CHECKPOINT_TAG = `model.ckpt-${checkpointNumber}`;
    const EXPORT_PATH = path.posix.join(MOUNT, "exports", name);
    const TAR_PATH = path.posix.join(EXPORT_PATH, `${name}.tar.gz`);

    if (!fs.existsSync(path.posix.join(MOUNT, "train", `${CHECKPOINT_TAG}.meta`))) {
      Promise.reject("cannot find requested checkpoint");
      return;
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

    await this.UpdateCheckpoints(id); // <-- get rid of soon
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

    const MOUNTED_MODEL_DIR = path.posix.join(MOUNT, "exports", modelExport.name);
    const MOUNTED_MODEL_PATH = path.posix.join(MOUNTED_MODEL_DIR, `${modelExport.name}.tar.gz`);
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
      return;
    }
    if (!fs.existsSync(videoPath)) {
      Promise.reject("video not found");
      return;
    }

    this.projects[ID].exports[modelExport.name].testingInProgress = true;

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

    const OUTPUT_VID_PATH = path.posix.join(MOUNT, "inference.mp4");
    if (!fs.existsSync(OUTPUT_VID_PATH)) return "cant find output video";

    const CUSTOM_VID_DIR = path.posix.join(MOUNTED_MODEL_DIR, "tests", videoCustomName);
    const CUSTOM_VID_PATH = path.posix.join(CUSTOM_VID_DIR, `${videoCustomName}.mp4`);
    await mkdirp(CUSTOM_VID_DIR);
    await fs.promises.copyFile(OUTPUT_VID_PATH, CUSTOM_VID_PATH);

    this.projects[ID].containers.test = null;
    this.projects[ID].exports[modelExport.name].testingInProgress = false;
    return "testing complete";
  }

  async UpdateCheckpoints(id: string): Promise<void> {
    const METRICSPATH = path.posix.join(this.projects[id].directory, "metrics.json");
    if (fs.existsSync(METRICSPATH)) {
      const metrics = JSON.parse(fs.readFileSync(METRICSPATH, "utf8"));
      while (Object.keys(metrics.precision).length > Object.keys(this.projects[id].checkpoints).length) {
        const CURRENT_CKPT = Object.keys(this.projects[id].checkpoints).length;
        const step = Object.keys(metrics.precision)[CURRENT_CKPT];
        this.projects[id].checkpoints[step] = {
          step: parseInt(step, 10),
          metrics: {
            precision: metrics.precision[step],
            loss: null,
            intersectionOverUnion: null //i will probably push an edit to the metrics container soon to make this easier
          },
          status: {
            exporting: false,
            exportPaths: []
          }
        };
        this.projects[id].status.currentEpoch = parseInt(step, 10);
      }
    } else this.projects[id].status.currentEpoch = 0;

    Promise.resolve();
  }

  async halt(id: string): Promise<void> {
    if (this.projects[id].containers.train) {
      if ((await this.projects[id].containers.train.inspect()).State.Running) {
        await this.projects[id].containers.train.kill({ force: true });
      }
    }
    this.projects[id].status.trainingState = NOT_TRAINING;
    Promise.resolve();
  }

  async toggleContainer(id: string, pause: boolean): Promise<void> {
    if (!this.projects[id].status.trainingState) {
      console.log("not training");
      Promise.resolve();
      return;
    }
    if (!this.projects[id].containers.train) {
      console.log("no container to pause");
      Promise.resolve();
      return;
    }
    const CONTAINER = this.projects[id].containers.train;

    if (pause) {
      if (!(await CONTAINER.inspect()).State.Paused) {
        await CONTAINER.pause();
        this.projects[id].status.trainingState = PAUSED;
      }
    } else {
      if ((await CONTAINER.inspect()).State.Paused) {
        CONTAINER.unpause();
        this.projects[id].status.trainingState = TRAINING;
      }
    }
    Promise.resolve();
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
}
