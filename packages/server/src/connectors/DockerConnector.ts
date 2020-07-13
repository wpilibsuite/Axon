import * as Dockerode from "dockerode";

export default class DockerConnector {
  readonly docker: Dockerode;

  constructor() {
    this.docker = new Dockerode();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.docker.ping();
    } catch (e) {
      return false;
    }
    return true;
  }
}
