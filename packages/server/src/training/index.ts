import * as Dockerode from "dockerode";
import * as fs from 'fs';

export default class Trainer {
  running: boolean;
  
  readonly docker = new Dockerode();

  constructor() {

      this.pull('gcperkins/wpilib-ml-base').
      then(() =>
      this.pull('gcperkins/wpilib-ml-dataset')).then(() => {
      this.running = true;
      console.log("image pull complete")
      this.start("abc", "proj", {steps:15})
    })

  }

  async pull(name: string): Promise<string> {
    return new Promise((resolve,reject) => {
      this.docker.pull(name, (err: string, stream: { pipe: (arg0: NodeJS.WriteStream) => void; }) => {
        stream.pipe(process.stdout);
        console.log(err)
        this.docker.modem.followProgress(stream, onFinished);
        function onFinished(err: string, output: string) {
            if (!err) {resolve(output); }
            else { reject(err); }
          }
        })
    });
  }
  
  start(id: string, name: string, hyperparameters: object): void {
      
      let mount = process.cwd();
      if (mount.includes(':\\'))
      {
        // MOUNT PATH MODIFICATION IS FOR WINDOWS ONLY!
        mount = mount.replace('C:\\', '/c/')
        mount = mount.replace(/\\/g,'/')
      }
      mount = mount.concat(`/mount/${id}`)
      fs.mkdirSync(mount, { recursive: true })
      mount = `${mount}:/opt/ml/model:rw`
      
      hyperparameters["name"] = name
      fs.writeFileSync(`mount/${id}/hyperparameters.json`, JSON.stringify(hyperparameters)); 
      fs.writeFileSync(`mount/${id}/log.json`, JSON.stringify({status:"starting"})); 

      let timebuffer = true
      const watcher = fs.watch(`./mount/${id}/log.json`, () => {
        setTimeout(() => timebuffer = false, 1000)
        if (!timebuffer){
          console.log("log changed")
          timebuffer = true
        }
      });

      console.log("starting")

      this.runContainer('testdataset',id,mount, "dataset ready. Training...")
        .then(message => {
          console.log(message)

      return this.runContainer('testtrain',id,mount, "training complete")})
        .then(message => {
          console.log(message)

      return this.runContainer('testtflite',id,mount, "tflite conversion complete")})
        .then(message => {
          console.log(message)

      return this.runContainer('testcoral',id,mount, "done")})
        .then(message => {
          console.log(message)
          watcher.close()

      }).catch(
        err => console.log(err)
      );
    }

    async runContainer(image: string, id: string, mount: string, message: string): Promise<string> {
      let training_container: Dockerode.Container;
      return new Promise((resolve, reject) => {
        this.docker.createContainer({
          Image: image,
          name: id,
          'Volumes': {'/opt/ml/model': {}},
          'HostConfig': {'Binds': [mount]}
        }).then(
          container => {
            training_container = container;
            return training_container.start();
        }).then(
          data => training_container.wait()
        ).then(
          data => {
            return training_container.remove();
        }).then(
          data => resolve(message)
        ).catch(
          err => reject(err)
        )
      });
  }
}

