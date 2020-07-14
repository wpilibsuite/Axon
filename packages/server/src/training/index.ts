import * as Dockerode from "dockerode";
const fs = require('fs');

export default class Trainer {
  running: boolean;
  
  readonly docker = new Dockerode();

  constructor() {

      this.pull('gcperkins/wpilib-ml-base').
      then(() =>
      this.pull('gcperkins/wpilib-ml-dataset')).then(() => {
      this.running = true;
      console.log("image pull complete")
      // this.start("abc", "proj", {steps:15})
    })

  }

  async pull(name){
    return new Promise((resolve,reject) => {
      this.docker.pull(name, (err, stream) => {
        stream.pipe(process.stdout);
        this.docker.modem.followProgress(stream, onFinished);
        function onFinished(err, output) {
            if (!err) {resolve('\nDone pulling.'); }
            else { reject(err); }
          }
        })
    });
  }
  
  start(id, name, hyperparameters): void {
      
      var mount = process.cwd();
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

      var timebuffer = true
      const watcher = fs.watch(`./mount/${id}/log.json`, (curr, prev) => {
        setTimeout(() => timebuffer = false, 1000)
        if (!timebuffer){
          console.log("log changed")
          timebuffer = true
        }
      });

      console.log("starting")

      var training_container
      this.runContainer('testdataset',id,mount, this.running, "dataset ready. Training...")
        .then(message => {
          console.log(message)

      return this.runContainer('testtrain',id,mount, this.running, "training complete")})
        .then(message => {
          console.log(message)

      return this.runContainer('testtflite',id,mount, this.running, "tflite conversion complete")})
        .then(message => {
          console.log(message)

      return this.runContainer('testcoral',id,mount, this.running, "done")})
        .then(message => {
          console.log(message)
          watcher.close()

      }).catch(
        err => console.log(err)
      );
    }

    async runContainer(image, id, mount, running, message){
      var training_container;
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

