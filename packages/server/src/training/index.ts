import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { Checkpoint } from "../schema/__generated__/graphql";
import { Container } from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";

export default class Trainer {
  CONTAINERMOUNT = "/opt/ml/model";
  running: boolean;
  projects: {
    [id: string]: {
      name: string;
      mount_path: string;
      training_container: Container;
      metrics_container: Container;
    };
  };

  readonly docker = new Dockerode();

  constructor() {
    this.pull("gcperkins/wpilib-ml-dataset")
      .then(() => this.pull("gcperkins/wpilib-ml-train"))
      .then(() => this.pull("gcperkins/wpilib-ml-tflite"))
      .then(() => this.pull("gcperkins/wpilib-ml-metrics"))
      .then(() => {
        this.running = true;
        console.log("image pull complete");
      });
    this.projects = {};
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

  async start(id: string, hyperparameters: unknown): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const DATASET = path.basename(hyperparameters["datasetPath"]);
        const MOUNT = Trainer.getMountPath(id).replace(/\\/g, "/");
        const MOUNTCMD = Trainer.getMountCmd(MOUNT, this.CONTAINERMOUNT);
        const CHECKPOINT = hyperparameters["checkpoint"];

        this.projects[id] = {
          name: hyperparameters["name"],
          mount_path: MOUNT,
          training_container: null,
          metrics_container: null
        };

        hyperparameters["batch-size"] = hyperparameters["batchSize"];
        hyperparameters["eval-frequency"] = hyperparameters["evalFrequency"];
        hyperparameters["dataset-path"] = hyperparameters["datasetPath"];
        hyperparameters["percent-eval"] = hyperparameters["percentEval"];
        if (hyperparameters["checkpoint"] != "default") {
          hyperparameters["checkpoint"] = path.posix.join("checkpoints", hyperparameters["checkpoint"]);
        }

        fs.mkdirSync(path.posix.join(MOUNT, "dataset"), { recursive: true });
        fs.writeFileSync(path.posix.join(MOUNT, "hyperparameters.json"), JSON.stringify(hyperparameters));
        fs.writeFileSync(path.posix.join(MOUNT, "metrics.json"), JSON.stringify({ precision: { "0": 0 } }));

        fs.promises
          .copyFile(path.posix.join("data/datasets", DATASET), path.posix.join(MOUNT, "dataset", DATASET))
          .then(() => {
            console.log(`copied ${DATASET} to mount`);
            if (CHECKPOINT != "default") {
              if (!fs.existsSync(path.posix.join(MOUNT, "checkpoints"))) {
                fs.mkdirSync(path.posix.join(MOUNT, "checkpoints"), { recursive: true });
              }
              fs.copyFileSync(
                //yes i know
                path.posix.join("data", "checkpoints", CHECKPOINT.concat(".data-00000-of-00001")),
                path.posix.join(MOUNT, "checkpoints", CHECKPOINT.concat(".data-00000-of-00001"))
              );
              fs.copyFileSync(
                path.posix.join("data", "checkpoints", CHECKPOINT.concat(".index")),
                path.posix.join(MOUNT, "checkpoints", CHECKPOINT.concat(".index"))
              );
              fs.copyFileSync(
                path.posix.join("data", "checkpoints", CHECKPOINT.concat(".meta")),
                path.posix.join(MOUNT, "checkpoints", CHECKPOINT.concat(".meta"))
              );

              return this.deleteContainer(id);
            }
            return this.deleteContainer(id);
          })
          .then((message) => {
            console.log(message);
            return this.deleteContainer("metrics");
          })
          .then((message) => {
            console.log(message);

            return this.docker.createContainer({
              Image: "gcperkins/wpilib-ml-metrics",
              name: "metrics",
              Volumes: { [this.CONTAINERMOUNT]: {} },
              HostConfig: { Binds: [MOUNTCMD] }
            });
          })
          .then((container) => {
            this.projects[id].metrics_container = container;
            return container.start();
          })
          .then(() => this.runContainer("gcperkins/wpilib-ml-dataset", id, MOUNTCMD, "dataset ready. Training..."))
          .then((message) => {
            console.log(message);

            return this.runContainer("gcperkins/wpilib-ml-train", id, MOUNTCMD, "training finished");
          })
          .then((message) => {
            console.log(message);

            return this.exportBuffer(this.running);
          })
          .then((message) => {
            console.log(message);

            return this.runContainer("gcperkins/wpilib-ml-tflite", id, MOUNTCMD, "tflite conversion complete");
          })
          .then((message) => {
            console.log(message);
            resolve(message);
          })
          .catch((err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  private async runContainer(image: string, id: string, mount: string, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let training_container;
      this.docker
        .createContainer({
          Image: image,
          name: id,
          Volumes: { [this.CONTAINERMOUNT]: {} },
          HostConfig: { Binds: [mount] },
          AttachStdin: false,
          AttachStdout: true,
          AttachStderr: true,
          OpenStdin: false,
          StdinOnce: false,
          Tty: true
        })
        .then((container) => {
          training_container = container;
          return container.attach({ stream: true, stdout: true, stderr: true });
        })
        .then((stream) => {
          stream.pipe(process.stdout);
          return training_container.start();
        })
        .then(() => {
          if (this.projects[id]) {
            this.projects[id].training_container = training_container;
          }
          return training_container.wait();
        })
        .then(() => training_container.remove())
        .then(() => resolve(message))
        .catch((err) => reject(err));
    });
  }

  private async exportBuffer(running: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      if (running) {
        resolve("automatic export enabled");
      } else {
        reject("automatic export disabled");
      }
    });
  }

  export(id: string, checkpointNumber: number, name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const MOUNT = Trainer.getMountPath(id).replace(/\\/g, "/");
        const MOUNTCMD = Trainer.getMountCmd(MOUNT, this.CONTAINERMOUNT);
        const exportparameters = {
          name: name,
          epochs: checkpointNumber
        };

        if (!fs.existsSync(path.posix.join(MOUNT, "train", `model.ckpt-${checkpointNumber}.meta`))) {
          reject("cannot find requested checkpoint");
        }

        fs.writeFileSync(path.posix.join(MOUNT, "hyperparameters.json"), JSON.stringify(exportparameters));
        this.deleteContainer(id)
          .then((message) => {
            console.log(message);
            return this.runContainer("gcperkins/wpilib-ml-tflite", id, MOUNTCMD, "tflite conversion complete");
          })
          .then((message) => resolve(message))
          .catch((message) => reject(message));
      } catch (err) {
        reject(`failed export: ${err}`);
      }
    });
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
        if (containers.length == 0) {
          resolve(`no ${id} container yet`);
        } else {
          const container = docker.getContainer(containers[0].Id);
          container
            .kill({ force: true })
            .then(() => container.remove())
            .then(() => resolve(`container ${id} killed`))
            .catch(() => {
              container.remove().then(() => resolve(`container ${id} killed`));
            });
        }
      });
    });
  }

  async getProjectCheckpoints(id: string): Promise<Checkpoint[]> {
    return new Promise((resolve) => {
      const metricsPath = path.posix.join(Trainer.getMountPath(id), "metrics.json");
      const checkpoints = [];
      if (fs.existsSync(metricsPath)) {
        try {
          const data = fs.readFileSync(metricsPath, "utf8");
          const metrics = JSON.parse(data);
          for (const step in metrics.precision) {
            checkpoints.push({
              step: parseInt(step, 10),
              metrics: {
                precision: metrics.precision[step],
                loss: null,
                intersectionOverUnion: null
              }
            });
          }
          if (checkpoints.length > 0) {
            console.log("current step: ", checkpoints[checkpoints.length - 1].step);
          }
        } catch (err) {
          console.log("could not read metrics", err);
        }
      }
      resolve(checkpoints);
    });
  }

  private static getMountPath(id: string): string {
    return `${PROJECT_DATA_DIR}/${id}/mount`;
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
