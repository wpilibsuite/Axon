import * as Dockerode from 'dockerode';
let docker = new Dockerode();

export default class Trainer {
  
  
    start(project) {

      var mount = process.cwd();
      // MOUNT PATH MODIFICATION IS FOR WINDOWS ONLY!
      mount = mount.replace('C:\\', '/c/')
      mount = mount.replace(/\\/g,'/')
      mount = mount.concat('/mount')
      var mount = `${mount}:/opt/ml/model:rw`

      console.log(mount)

      var training_container;
      docker.createContainer({
        Image: 'coral',
        name: 'trainjob',
        Entrypoint: 'python',
        Cmd: ['pretend_train.py'],
        'Volumes': {'/opt/ml/model': {}},
        'Hostconfig': {'Binds': [mount]},
      }).then(function(container) {
        training_container = container;
        return training_container.start();
      }).then(function(data) {
        return training_container.stop();
      }).then(function(data) {
        return training_container.remove();
      }).then(function(data) {
        console.log('container removed');
      }).catch(function(err) {
        console.log(err);
      });

    }    
    }
