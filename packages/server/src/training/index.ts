import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as Path from "path";

export default class Trainer {
  running: boolean;
  projects: unknown;
  checkpoint: any;

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

  async pull(name: string): Promise<string> {
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

    const MOUNT = `Projects/${id}/mount`;
    const CONTAINERMOUNT = "/opt/ml/model";
    const DATASET = Path.basename(hyperparameters["datasetPath"]);

    let mountcmd = process.cwd();
    if (mountcmd.includes(":\\")) {
      // MOUNT PATH MODIFICATION IS FOR WINDOWS ONLY!
      mountcmd = mountcmd.replace("C:\\", "/c/");
      mountcmd = mountcmd.replace(/\\/g, "/");
      console.log(mountcmd);
    }
    mountcmd = Path.posix.join(mountcmd, MOUNT);
    mountcmd = `${mountcmd}:${CONTAINERMOUNT}:rw`;

    hyperparameters["batch-size"] = hyperparameters["batchSize"];
    hyperparameters["eval-frequency"] = hyperparameters["evalFrequency"];
    hyperparameters["dataset-path"] = hyperparameters["datasetPath"];
    hyperparameters["percent-eval"] = hyperparameters["percentEval"];

    fs.mkdirSync(Path.posix.join(MOUNT, "dataset"), { recursive: true });
    fs.writeFileSync(Path.posix.join(MOUNT, "hyperparameters.json"), JSON.stringify(hyperparameters));
    fs.writeFileSync(Path.posix.join(MOUNT, "metrics.json"), JSON.stringify({ precision: { "0": 0 } }));

    fs.promises
      .copyFile(Path.posix.join("data/datasets", DATASET), Path.posix.join(MOUNT, "dataset", DATASET))
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

        //the line below is apparently "experimental" so lets hope that it doesnt delete your root directory
        fs.rmdirSync(Path.posix.join(".",MOUNT,"train"), { recursive: true });

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

  async runContainer(image: string, id: string, mount: string, message: string): Promise<string> {
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

  async exportBuffer(running: boolean): Promise<string> {
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

  async deleteContainer(id: string): Promise<string> {
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
            .then(() => resolve(`container ${id} killed`));
        }
      });
    });
  }

  async getProjectCheckpoints(id: string): Promise<Array<unknown>> {
    return new Promise((resolve, reject) => {
      const metricsPath = Path.posix.join("Projects", id, "mount", "metrics.json");
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
}
