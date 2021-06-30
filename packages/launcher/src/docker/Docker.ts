import * as Dockerode from "dockerode";
import { Container, ContainerCreateOptions } from "dockerode";
const fs = window.require("fs");

export const CONTAINER_MOUNT_PATH = "/usr/src/app/packages/server/data";
export const VOLUME_NAME = "wpilib-axon-volume";

export default class Docker {
  readonly docker: Dockerode;
  readonly socket: { socketPath: string };
  mount: string;
  readonly image = { name: "wpilib/axon", tag: "edge" };

  constructor(docker: Dockerode, socket: { socketPath: string }) {
    this.docker = docker;
    this.socket = socket;
    this.mount = VOLUME_NAME;
  }

  /**
   * Get the status of the Docker Service.
   */
  async isConnected(): Promise<boolean> {
    try {
      return (await this.docker.ping()) === "OK";
    } catch (e) {
      return false;
    }
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
  async reset(): Promise<void> {
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
        console.log("Id: " + listContainer.Id + " State" + listContainer.State);
        if (listContainer.State === "running") {
          console.log("stopping " + listContainer.Id);
          await container.stop();
        }
        console.log("removing " + listContainer.Id);
        try {
          await container.remove();
        } catch (e) {
          console.log("Stopping main axon container");
        }
      })
    );
  }

  /**
   * Pull resources needed for training.
   */
  async pullImage(tag: string): Promise<void> {
    console.log("Docker ping: " + (await this.docker.ping()));
    return new Promise<void>((resolve) => {
      console.info(`Pulling image ${this.image.name}:${tag}`);
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
        Binds: [`${this.mount}:${CONTAINER_MOUNT_PATH}:rw`, `/var/run/docker.sock:/var/run/docker.sock`],
        PortBindings: Object.assign({}, ...ports.map((port) => ({ [port]: [{ HostPort: port.split("/")[0] }] })))
      },
      ExposedPorts: Object.assign({}, ...ports.map((port) => ({ [port]: {} })))
    };
    console.log(`Options created for ${this.image.name}:${this.image.tag}`);

    const container = await this.docker.createContainer(options);
    const logFilePath = window.require("electron-log").transports.file.getFile().path;
    console.log("Log file path: " + logFilePath);
    const logFile = fs.createWriteStream(logFilePath);
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

  public async resetDocker(): Promise<void> {
    // prune containers
    await this.docker.pruneContainers();
    console.log("Pruned containers");
    // delete wpilib-axon-volume volume
    try {
      const volume = await this.docker.getVolume("wpilib-axon-volume");
      console.log("Got volume");
      await volume.remove();
      console.log("Removed volume");
    } catch (error) {
      console.log("No volume to delete");
    }
  }
}
