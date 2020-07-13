import * as Dockerode from "dockerode";

export default class Trainer {
  readonly docker = new Dockerode();

  start(): void {
    this.docker
      .run("hello-world", [], process.stdout)
      .then(function (data) {
        const output = data[0];
        const container = data[1];
        console.log(output.StatusCode);
        return container.remove();
      })
      .then(function () {
        console.log("container removed");
      })
      .catch(function (err) {
        console.log(err);
      });
  }
}
