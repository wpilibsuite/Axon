import * as Dockerode from 'dockerode';
const fs = require('fs');

let docker = new Dockerode();

export default class Trainer {
  
    constructor(){
      
      docker.listImages({}, function(err, images) { 
        var tags = images.map(image => image.RepoTags[0])
        if (!tags.includes('coral:latest')){
          docker.buildImage({
            context: __dirname,
            src: ['Dockerfile', 'pretend_train.py']
          }, {
            t: 'coral'
          }, function(error, output) {
            if (error) {
              return console.error(error);
            }
            output.pipe(process.stdout);
          });
        }
      })

  }
  
    start(project) {

      var mount = process.cwd();
      if (mount.includes(':\\'))
      {
        // MOUNT PATH MODIFICATION IS FOR WINDOWS ONLY!
        mount = mount.replace('C:\\', '/c/')
        mount = mount.replace(/\\/g,'/')
      }
      mount = mount.concat('/mount')
      var mount = `${mount}:/opt/ml/model:rw`

      console.log(mount)

      var training_container;
      docker.createContainer({
        Image: 'coral',
        name: 'trainjob',
        'Volumes': {'/opt/ml/model': {}},
        'Hostconfig': {'Binds': [mount]}
      }).then(
        container => {
          training_container = container;
          return training_container.start();
      }).then(
        data => training_container.wait()
      ).then(
        data => training_container.remove()
      ).then(
        data => console.log('container removed')
      ).catch(
        err => console.log(err)
      );

      
      const log_file = './mount/log.json';
      
      fs.watchFile(log_file, (curr, prev) => {
        console.log(`${log_file} file Changed`);
      });
      
    }    
    }
