import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { Checkpoint } from "../schema/__generated__/graphql";
import { Container } from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";

export default class Trainer {
  running: boolean;
  projects: { [id: string]: { training_container: Container; metrics_container: Container; metrics: Container } };

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

  start(id: string, hyperparameters: unknown): void {
    this.projects[id] = {
      training_container: null,
      metrics_container: null,
      metrics: null
    };

    const MOUNT = Trainer.getMountPath(id).replace(/\\/g, "/");
    const CONTAINERMOUNT = "/opt/ml/model";
    const DATASET = path.basename(hyperparameters["datasetPath"]);

    let mountcmd = process.cwd();
    if (mountcmd.includes(":\\")) {
      // MOUNT PATH MODIFICATION IS FOR WINDOWS ONLY!
      mountcmd = mountcmd.replace("C:\\", "/c/").replace(/\\/g, "/");
      console.log(mountcmd);
    }
    mountcmd = path.posix.join(mountcmd, MOUNT);
    mountcmd = `${mountcmd}:${CONTAINERMOUNT}:rw`;

    hyperparameters["batch-size"] = hyperparameters["batchSize"];
    hyperparameters["eval-frequency"] = hyperparameters["evalFrequency"];
    hyperparameters["dataset-path"] = hyperparameters["datasetPath"];
    hyperparameters["percent-eval"] = hyperparameters["percentEval"];

    fs.mkdirSync(path.posix.join(MOUNT, "dataset"), { recursive: true });
    fs.writeFileSync(path.posix.join(MOUNT, "hyperparameters.json"), JSON.stringify(hyperparameters));
    fs.writeFileSync(path.posix.join(MOUNT, "metrics.json"), JSON.stringify({ precision: { "0": 0 } }));

    fs.promises
      .copyFile(path.posix.join("data/datasets", DATASET), path.posix.join(MOUNT, "dataset", DATASET))
      .then(() => {
        console.log(`copied ${DATASET} to mount`);
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
          Volumes: { CONTAINERMOUNT: {} },
          HostConfig: { Binds: [mountcmd] }
        });
      })
      .then((container) => {
        this.projects[id].metrics_container = container;
        return container.start();
      })
      .then(() => this.runContainer("gcperkins/wpilib-ml-dataset", id, mountcmd, "dataset ready. Training..."))
      .then((message) => {
        console.log(message);

        return this.runContainer("gcperkins/wpilib-ml-train", id, mountcmd, "training finished");
      })
      .then((message) => {
        console.log(message);

        return this.exportBuffer(this.running);
      })
      .then((message) => {
        console.log(message);

        return this.runContainer("gcperkins/wpilib-ml-tflite", id, mountcmd, "tflite conversion complete");
      })
      .then((message) => {
        console.log(message);
      })
      .catch((err) => console.log(err));
  }

  private async runContainer(image: string, id: string, mount: string, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.docker
        .createContainer({
          Image: image,
          name: id,
          Volumes: { CONTAINERMOUNT: {} },
          HostConfig: { Binds: [mount] },
          AttachStdin: false,
          AttachStdout: true,
          AttachStderr: true,
          OpenStdin: false,
          StdinOnce: false,
          Tty: true
        })
        .then((container) => {
          this.projects[id].training_container = container;
          return container.attach({ stream: true, stdout: true, stderr: true });
        })
        .then((stream) => {
          stream.pipe(process.stdout);
          return this.projects[id].training_container.start();
        })
        .then(() => this.projects[id].training_container.wait())
        .then(() => this.projects[id].training_container.remove())
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
              container.remove();
              resolve(`container ${id} killed`);
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
}
