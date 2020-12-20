import * as Dockerode from "dockerode";
import { Container } from "dockerode";
import * as path from "path";

export const CONTAINER_MOUNT_PATH = "/opt/ml/model";

export default class Docker {
  static readonly docker = new Dockerode();

  public static async testDaemon(): Promise<boolean> {
    try {
      await this.docker.info();
      return true;
    } catch {
      return false;
    }
  }

  static async pull(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.docker.pull(name, (err: string, stream: { pipe: (arg0: NodeJS.WriteStream) => void }) => {
        try {
          stream.pipe(process.stdout);
          this.docker.modem.followProgress(stream, onFinished);
        } catch {
          console.log("cant pull image");
          resolve();
        }
        function onFinished(err: string, output: string) {
          if (!err) {
            resolve(output);
          } else {
            console.log(err);
            reject(err);
          }
        }
      });
    });
  }

  static async createContainer(
    image: string,
    tag: string,
    id: string,
    mount: string,
    port: string = null
  ): Promise<string> {
    const NAME = tag + id;
    const MOUNTCMD = `${mount}:${CONTAINER_MOUNT_PATH}:rw`;

    const options = {
      Image: image,
      name: NAME,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      Tty: true,
      Volumes: { [CONTAINER_MOUNT_PATH]: {} },
      HostConfig: { Binds: [MOUNTCMD] }
    };
    if (port) {
      const PORTCMD = `${port}/tcp`;
      options["ExposedPorts"] = { [PORTCMD]: {} };
      options.HostConfig["PortBindings"] = { [PORTCMD]: [{ HostPort: port }] };
    }

    await Docker.deleteContainer(NAME);
    const container = await this.docker.createContainer(options);
    (await container.attach({ stream: true, stdout: true, stderr: true })).pipe(process.stdout);

    return container.id;
  }

  static async deleteContainer(name: string): Promise<void> {
    const container: Container = await new Promise((resolve) => {
      const opts = {
        limit: 1,
        filters: `{"name": ["${name}"]}`
      };
      this.docker.listContainers(opts, (err, containers) => {
        resolve(containers.length > 0 ? this.docker.getContainer(containers[0].Id) : null);
      });
    });

    if (container) {
      if ((await container.inspect()).State.Running) {
        await container.kill({ force: true });
      }
      await container.remove();
    }
    Promise.resolve();
  }

  static async startContainer(containerID: string) {
    await this.docker.getContainer(containerID).start();
  }

  static async removeContainer(containerID: string) {
    await this.docker.getContainer(containerID).stop();
    await this.docker.getContainer(containerID).remove();
  }

  static async runContainer(containerID: string): Promise<void> {
    const container: Container = await this.docker.getContainer(containerID);
    await container.start();
    await container.wait();
    await container.remove();
    Promise.resolve();
    return;
  }

  static async toggleContainer(containerID: string, pause: boolean): Promise<void> {
    const container: Container = this.docker.getContainer(containerID);

    if (pause) {
      if (!(await container.inspect()).State.Paused) {
        await container.pause();
      }
    } else {
      if ((await container.inspect()).State.Paused) {
        container.unpause();
      }
    }
    Promise.resolve();
  }
}
