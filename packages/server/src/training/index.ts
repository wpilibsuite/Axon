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
        // setTimeout(() => this.halt("abc"), 10000);
        // this.start("abc", {
        //   name: "model",
        //   epochs: 1,
        //   batchsize: 1,
        //   evalfrequency: 1,
        //   checkpoint: "default",
        //   datasetpath: "/opt/ml/model/dataset/full_data.tar",
        //   percenteval: 50
        // });
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

    let mount = process.cwd();
    if (mount.includes(":\\")) {
      // MOUNT PATH MODIFICATION IS FOR WINDOWS ONLY!
      mount = mount.replace("C:\\", "/c/");
      mount = mount.replace(/\\/g, "/");
    }
    mount = mount.concat(`/mount/${id}`);
    fs.mkdirSync(mount, { recursive: true });
    mount = `${mount}:/opt/ml/model:rw`;

    //bridge between the graphql naming convention and the python naming convention
    hyperparameters["batch-size"] = hyperparameters["batchsize"];
    // delete hyperparameters["batchsize"];
    hyperparameters["eval-frequency"] = hyperparameters["evalfrequency"];
    // delete hyperparameters["evalfrequency"];
    hyperparameters["dataset-path"] = hyperparameters["datasetpath"];
    // delete hyperparameters["datasetpath"];
    hyperparameters["percent-eval"] = hyperparameters["percenteval"];
    // delete hyperparameters["percenteval"];

    fs.writeFileSync(`mount/${id}/hyperparameters.json`, JSON.stringify(hyperparameters));
    fs.writeFileSync(`mount/${id}/metrics.json`, JSON.stringify({ precision: { "0": 0 } }));

    //#watcher is not working- currently using query based file read
    // let timebuffer = true;
    // const watcher = fs.watch(`./mount/${id}/metrics.json`, () => {
    //   setTimeout(() => (timebuffer = false), 1000);
    //   if (!timebuffer) {
    //     console.log("metrics saved");
    //     fs.readFile(`mount/${id}/metrics.json`, 'utf8', (err, metricsFile) => {
    //       try {
    //         const metrics = JSON.parse(metricsFile)
    //           let currentstep = 0;
    //           for (var step in metrics.precision) {
    //             currentstep = (currentstep < parseInt(step)) ? parseInt(step) : currentstep;
    //           }
    //           this.checkpoint.step = currentstep
    //           this.checkpoint.precision = metrics.precision[currentstep.toString(10)]
    //           console.log("current step: ",currentstep)

    //       } catch(err) {
    //         console.log('could not read metrics', err)
    //       }
    //       timebuffer = true;
    //     })
    //   }
    // });

    console.log("starting");

    this.deleteContainer(id)
      .then((message) => {
        console.log(message);
        return this.deleteContainer("metrics");
      })
      .then((message) => {
        console.log(message);

        fs.rmdirSync(`./mount/${id}/train/`, { recursive: true });

        return this.docker.createContainer({
          Image: "gcperkins/wpilib-ml-metrics",
          name: "metrics",
          Volumes: { "/opt/ml/model": {} },
          HostConfig: { Binds: [mount] }
        });
      })
      .then((container) => {
        this.projects[id].metrics_container = container;
        return container.start();
      })
      .then(() => this.runContainer("gcperkins/wpilib-ml-dataset", id, mount, "dataset ready. Training..."))
      .then((message) => {
        console.log(message);

        return this.runContainer("gcperkins/wpilib-ml-train", id, mount, "training finished");
      })
      .then((message) => {
        console.log(message);

        return this.exportBuffer(this.running);
      })
      .then((message) => {
        console.log(message);

        return this.runContainer("gcperkins/wpilib-ml-tflite", id, mount, "tflite conversion complete");
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
          Volumes: { "/opt/ml/model": {} },
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
}
