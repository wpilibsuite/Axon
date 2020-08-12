import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { Checkpoint, Export } from "../schema/__generated__/graphql";
import { Container } from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";
import { Project } from "../store";

const CONTAINER_MOUNT_PATH = "/opt/ml/model";

type ContainerParameters = {
  name: string;
  epochs: number;
  "batch-size": number;
  "eval-frequency": number;
  "dataset-path": string;
  "percent-eval": number;
  checkpoint: string;
};

export default class Trainer {
  running: boolean;
  projects: {
    [id: string]: {
      mount_path: string;
      training_container: Container;
      metrics_container: Container;
      inProgress: boolean;
      checkpoints: {
        [step: number]: Checkpoint;
      };
    };
  };

  readonly docker = new Dockerode();

  constructor() {
    this.projects = {};
    this.pull("gcperkins/wpilib-ml-dataset")
      .then(() => this.pull("gcperkins/wpilib-ml-train"))
      .then(() => this.pull("gcperkins/wpilib-ml-tflite"))
      .then(() => this.pull("gcperkins/wpilib-ml-metrics"))
      .then(() => this.pull("gcperkins/wpilib-ml-test"))
      .then(() => {
        this.running = true;
        console.log("image pull complete");
      });
  }

  private async pull(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.docker.pull(name, (err: string, stream: { pipe: (arg0: NodeJS.WriteStream) => void }) => {
        stream.pipe(process.stdout);
        console.log(err);
        this.docker.modem.followProgress(stream, onFinished);
        function onFinished(err: string, output: string) {
          if (!err) {
            resolve(output);
          } else {
            reject(err);
          }
        }
      });
    });
  }

  async start(project: Project): Promise<string> {
    const dataset = (await project.getDatasets())[0];
    try {
      const mount = Trainer.getMountPath(project.id);
      const mountCmd = Trainer.getMountCmd(mount, CONTAINER_MOUNT_PATH);

      if (!(project.id in this.projects)) {
        this.projects[project.id] = {
          mount_path: mount,
          training_container: null,
          metrics_container: null,
          inProgress: null,
          checkpoints: []
        };
      }
      this.projects[project.id].inProgress = true;

      const containerParameters: ContainerParameters = {
        name: project.name,
        epochs: project.epochs,
        "batch-size": project.batchSize,
        "dataset-path": path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path)),
        "eval-frequency": project.evalFrequency,
        "percent-eval": project.percentEval,
        checkpoint: "default"
      };

      if (project.initialCheckpoint != "default") {
        containerParameters.checkpoint = path.posix.join("checkpoints", project.initialCheckpoint);
      }

      fs.mkdirSync(path.posix.join(mount, "dataset"), { recursive: true });
      fs.writeFileSync(path.posix.join(mount, "hyperparameters.json"), JSON.stringify(containerParameters));

      await fs.promises.copyFile(
        path.posix.join("data", dataset.path),
        path.posix.join(mount, "dataset", path.basename(dataset.path))
      );
      console.log(`copied ${dataset.path} to mount`);

      if (project.initialCheckpoint != "default") {
        if (!fs.existsSync(path.posix.join(mount, "checkpoints"))) {
          fs.mkdirSync(path.posix.join(mount, "checkpoints"), { recursive: true });
        }
        await Promise.all([
          fs.promises.copyFile(
            path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(".data-00000-of-00001")),
            path.posix.join(mount, "checkpoints", project.initialCheckpoint.concat(".data-00000-of-00001"))
          ),
          fs.promises.copyFile(
            path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(".index")),
            path.posix.join(mount, "checkpoints", project.initialCheckpoint.concat(".index"))
          ),
          fs.promises.copyFile(
            path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(".meta")),
            path.posix.join(mount, "checkpoints", project.initialCheckpoint.concat(".meta"))
          )
        ]);
      }

      await this.deleteContainer(project.id);
      await this.deleteContainer("metrics");

      this.projects[project.id].metrics_container = await this.docker.createContainer({
        Image: "gcperkins/wpilib-ml-metrics",
        name: "metrics",
        Volumes: { [CONTAINER_MOUNT_PATH]: {} },
        HostConfig: { Binds: [mountCmd] }
      });
      this.projects[project.id].metrics_container.start();

      await this.runContainer("gcperkins/wpilib-ml-dataset", project.id, mountCmd, "dataset ready. Training...");

      await this.runContainer("gcperkins/wpilib-ml-train", project.id, mountCmd, "training finished");

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

    if (!(id in this.projects)) {
      this.projects[id] = {
        mount_path: mount,
        training_container: null,
        metrics_container: null,
        inProgress: null,
        checkpoints: []
      };
    }
    this.projects[id].training_container = await this.docker.createContainer(options);

    (await this.projects[id].training_container.attach({ stream: true, stdout: true, stderr: true })).pipe(
      process.stdout
    );

    await this.projects[id].training_container.start();

    await this.projects[id].training_container.wait();

    await this.projects[id].training_container.remove();

    console.log(message);
    return message;
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const MOUNT = Trainer.getMountPath(id);
    const MOUNTCMD = Trainer.getMountCmd(MOUNT, CONTAINER_MOUNT_PATH);
    const CHECKPOINT_TAG = `model.ckpt-${checkpointNumber}`;
    const EXPORT_PATH = path.posix.join(MOUNT, "exports", name);

    if (!fs.existsSync(path.posix.join(MOUNT, "train", `${CHECKPOINT_TAG}.meta`))) {
      Promise.reject("cannot find requested checkpoint");
    }

    if (!fs.existsSync(path.posix.join(EXPORT_PATH, "checkpoint"))) {
      fs.mkdirSync(path.posix.join(EXPORT_PATH, "checkpoint"), { recursive: true });
    }

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

    await this.getProjectCheckpoints(id);
    this.projects[id].checkpoints[checkpointNumber].status.exporting = true;

    await this.deleteContainer(id);

    const exportparameters = {
      name: name,
      epochs: checkpointNumber,
      "export-dir": path.posix.join("exports", name)
    };
    fs.writeFileSync(path.posix.join(MOUNT, "exportparameters.json"), JSON.stringify(exportparameters));
    await this.runContainer("gcperkins/wpilib-ml-tflite", id, MOUNTCMD, "tflite conversion complete");

    this.projects[id].checkpoints[checkpointNumber].status.exportPaths.push(EXPORT_PATH);
    this.projects[id].checkpoints[checkpointNumber].status.exporting = false;

    return "exported";
  }

  async test(
    id: string,
    modelName: string,
    directory: string,
    tarPath: string,
    videoPath: string,
    videoFilename: string,
    videoCustomName: string
  ): Promise<string> {
    const MOUNT = Trainer.getMountPath(id);
    const MOUNTCMD = Trainer.getMountCmd(MOUNT, CONTAINER_MOUNT_PATH);

    const MOUNTED_MODEL_PATH = path.posix.join(MOUNT, "exports", modelName, `${modelName}.tar.gz`);
    const CONTAINER_MODEL_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "exports", modelName, `${modelName}.tar.gz`);

    const MOUNTED_VIDEO_PATH = path.posix.join(MOUNT, "videos", videoFilename);
    const CONTAINER_VIDEO_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "videos", videoFilename);

    if (!fs.existsSync(tarPath)) {
      Promise.reject("model not found");
    }
    if (!fs.existsSync(videoPath)) {
      Promise.reject("video not found");
    }
    if (!fs.existsSync(MOUNTED_MODEL_PATH)) {
      await fs.promises.copyFile(tarPath, MOUNTED_MODEL_PATH);
    }
    if (!fs.existsSync(MOUNTED_VIDEO_PATH)) {
      await fs.promises.copyFile(videoPath, MOUNTED_VIDEO_PATH);
    }
    const testparameters = {
      "test-video": CONTAINER_VIDEO_PATH,
      "model-tar": CONTAINER_MODEL_PATH
    };
    fs.writeFileSync(path.posix.join(MOUNT, "testparameters.json"), JSON.stringify(testparameters));
    await this.deleteContainer(id);
    return this.runContainer("gcperkins/wpilib-ml-test", id, MOUNTCMD, "test complete");
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
      const metricsPath = path.posix.join(Trainer.getMountPath(id), "metrics.json");
      if (fs.existsSync(metricsPath)) {
        if (!(id in this.projects)) {
          this.projects[id] = {
            mount_path: Trainer.getMountPath(id),
            training_container: null,
            metrics_container: null,
            inProgress: null,
            checkpoints: []
          };
        }

        try {
          const data = fs.readFileSync(metricsPath, "utf8");
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
    const exportsPath = path.posix.join(Trainer.getMountPath(id), "exports");
    let exports: Export[] | never[] = [];
    if (fs.existsSync(exportsPath)) {
      const exportNames = (await fs.promises.readdir(exportsPath)).filter((name) =>
        fs.existsSync(path.posix.join(exportsPath, name, `${name}.tar.gz`))
      );
      exports = exportNames.map((exportName) => {
        const exportDir = path.posix.join(exportsPath, exportName);
        const tarPath = path.posix.join(exportDir, `${exportName}.tar.gz`);
        return {
          projectId: id,
          name: exportName,
          directory: path.posix.join(exportsPath, exportName),
          tarPath: tarPath
        };
      });
    }
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
