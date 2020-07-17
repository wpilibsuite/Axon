import * as Dockerode from "dockerode";
import * as fs from "fs";

export default class Trainer {
  running: boolean;

  readonly docker = new Dockerode();

  constructor() {
    this.pull("gcperkins/wpilib-ml-dataset")
      .then(() => this.pull("gcperkins/wpilib-ml-train"))
      .then(() => this.pull("gcperkins/wpilib-ml-tflite"))
      .then(() => {
        this.running = true;
        console.log("image pull complete");
        // setTimeout(() => this.halt("abc"), 10000);
        this.start("abc", {
          name: "model",
          epochs: 1,
          batchsize: 1,
          evalfrequency: 1,
          checkpoint: "default",
          datasetpath: "/opt/ml/model/dataset/full_data.tar",
          percenteval: 50
        });
      });
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
    delete hyperparameters["batchsize"];
    hyperparameters["eval-frequency"] = hyperparameters["evalfrequency"];
    delete hyperparameters["evalfrequency"];
    hyperparameters["dataset-path"] = hyperparameters["datasetpath"];
    delete hyperparameters["datasetpath"];
    hyperparameters["percent-eval"] = hyperparameters["percenteval"];
    delete hyperparameters["percenteval"];

    fs.writeFileSync(`mount/${id}/hyperparameters.json`, JSON.stringify(hyperparameters));
    fs.writeFileSync(`mount/${id}/log.json`, JSON.stringify({ status: "starting" }));

    let timebuffer = true;
    const watcher = fs.watch(`./mount/${id}/log.json`, () => {
      setTimeout(() => (timebuffer = false), 1000);
      if (!timebuffer) {
        console.log("log changed");
        timebuffer = true;
      }
    });

    console.log("starting");

    this.runContainer("gcperkins/wpilib-ml-dataset", id, mount, "dataset ready. Training...")
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
        watcher.close();
      })
      .catch((err) => console.log(err));
  }

  async runContainer(image: string, id: string, mount: string, message: string): Promise<string> {
    let training_container: Dockerode.Container;
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
          Tty: true,
          OpenStdin: false,
          StdinOnce: false
        })
        .then((container) => {
          training_container = container;
          return container.attach({ stream: true, stdout: true, stderr: true });
        })
        .then((stream) => {
          stream.pipe(process.stdout);
          return training_container.start();
        })
        .then(() => training_container.wait())
        .then(() => training_container.remove())
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
    const docker = this.docker;
    const opts = {
      limit: 1,
      filters: `{"name": ["${id}"]}`
    };
    this.docker.listContainers(opts, function (err, containers) {
      if (err) {
        console.log(err);
      }
      if (containers.length == 0) {
        console.log("no container");
      } else {
        console.log(containers[0].Image);
        const container = docker.getContainer(containers[0].Id);
        container.kill({ force: true }).then(() => console.log(`container ${id} killed`));
      }
    });
  }
}
