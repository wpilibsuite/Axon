import * as Dockerode from "dockerode";
import { Container, ContainerCreateOptions } from "dockerode";
const fs = window.require("fs");

export const CONTAINER_MOUNT_PATH = "/wpi-data";
export const VOLUME_NAME = "wpilib-axon-volume";

export default class Docker {
  readonly docker: Dockerode;
  mount: string;
  readonly image = { name: "wpilib/axon", tag: "edge" };

  constructor(docker: Dockerode) {
    this.docker = docker;
    this.mount = VOLUME_NAME;
  }

  /**
   * Get the status of the Docker Service.
   */
  async isConnected(): Promise<boolean> {
    try {
      console.log((await this.docker.ping()) + " ping");
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Checks if our container is created
   */
  async getContainers(): Promise<Dockerode.ContainerInfo[] | null> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ["axon=main"]
        }
      });
      console.log(containers);
      return containers;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get the docker version number.
   */
  async version(): Promise<string> {
    return (await this.docker.version()).Version;
  }

  /**
   * Reset Docker by removing all containers.
   */
  async reset(): Promise<boolean> {
    // Stop active containers that we manage
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        label: ["axon=main"]
      }
    });
    await Promise.all(
      containers.map(async (listContainer: { Id: string; State: string }) => {
        const container = await this.docker.getContainer(listContainer.Id);
        if (listContainer.State === "running") await container.stop();
        await container.remove();
      })
    );
    return true;
  }

  /**
   * Pull resources needed for training.
   */
  async pullImage(): Promise<void> {
    return new Promise<void>((resolve) => {
      console.info(`Pulling image ${this.image.name}:${this.image.tag}`);
      this.docker.pull(
        `${this.image.name}:${this.image.tag}`,
        (err: string, stream: { pipe: (arg0: NodeJS.WriteStream) => void }) => {
          this.docker.modem.followProgress(stream, () => {
            console.info(`Finished pulling image ${this.image.name}:${this.image.tag}`);
            resolve();
          });
        }
      );
    });
  }

  /**
   * Create a container for the provided project with the given image. Opens and binds ports as provided.
   *
   * If the container already exists (as known by its name), it will remove that container first.
   *
   * @param project The project for this container
   * @param image The image to base this container on
   * @param ports The ports to expose
   */
  async createContainer(): Promise<Container> {
    console.log(`Creating container ${this.image.name}`);
    const ports = ["3000", "4000"];

    const options: ContainerCreateOptions = {
      Image: `${this.image.name}:${this.image.tag}`,
      name: `axon`,
      Labels: {
        axon: "main",
        "wpilib-ml-name": this.image.name
      },
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      Tty: true,
      Volumes: { [CONTAINER_MOUNT_PATH]: {} },
      HostConfig: {
        Binds: [`${this.mount}:${CONTAINER_MOUNT_PATH}:rw`],
        PortBindings: Object.assign({}, ...ports.map((port) => ({ [port]: [{ HostPort: port.split("/")[0] }] })))
      },
      ExposedPorts: Object.assign({}, ...ports.map((port) => ({ [port]: {} })))
    };
    console.log(`Options created for ${this.image.name}:${this.image.tag}`);

    const container = await this.docker.createContainer(options);
    const logFile = fs.createWriteStream("log.txt"); // todo track down this file
    (await container.attach({ stream: true, stdout: true, stderr: true })).pipe(logFile);

    return container;
  }

  /**
   * Starts the provided container, and removes it when it stops.
   *
   * @param container The container to run
   */
  public async runContainer(container: Container): Promise<void> {
    await container.start();
    await container.wait();
    await container.remove();
  }
}