import * as Dockerode from "dockerode";
import { Container, ContainerCreateOptions, Node } from "dockerode";
import { DockerImage } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { DATA_DIR } from "../constants";
import * as path from "path";

export const CONTAINER_MOUNT_PATH = "/wpi-data";
export const VOLUME_NAME = "wpilib-axon-volume";

export default class Docker {
  readonly docker;
  mount: string;

  constructor(docker: Dockerode) {
    this.docker = docker;

    /* if we are inside the container, use the volume name. if not, use the data dir */

    /* someone come up with a better way to do this */
    this.mount = DATA_DIR === "/usr/src/app/packages/server/data" ? VOLUME_NAME : DATA_DIR;
  }

  /**
   * Derive the path to a projects directory in the mounted data volume
   * from a started container's perspective, to pass as an argument on start.
   *
   * @param project The project in question.
   */
  static containerProjectPath(project: Project): string {
    return path.posix.join(CONTAINER_MOUNT_PATH, project.directory.replace(DATA_DIR, ""));
  }

  /**
   * Get the status of the Docker Service.
   */
  async isConnected(): Promise<boolean> {
    try {
      console.log("Docker ping: " + (await this.docker.ping()));
    } catch (e) {
      return false;
    }
    return true;
  }

  getAxonVersion(): string {
    const version = process.env.AXON_VERSION;
    if (version !== undefined) {
      return version;
    }
    return "Development";
  }

  /**
   * Checks if all of our images are downloaded.
   */
  async isImagesReady(images: DockerImage[]): Promise<boolean> {
    try {
      await Promise.all(
        Object.entries(images).map(async ([, value]) => this.docker.getImage(`${value.name}:${value.tag}`).inspect())
      );
    } catch (e) {
      return false;
    }

    return true;
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
        label: ["wpilib=ml"]
      }
    });
    await Promise.all(
      containers.map(async (listContainer) => {
        const container = await this.docker.getContainer(listContainer.Id);
        if (listContainer.State == "running") await container.stop();
        await container.remove();
      })
    );
    return true;
  }

  /**
   * Pull resources needed for training.
   */
  async pullImages(images: DockerImage[]): Promise<void[]> {
    return Promise.all(
      Object.entries(images).map(
        async ([, value]) =>
          new Promise<void>((resolve) => {
            console.info(`Pulling image ${value.name}:${value.tag}`);
            this.docker.pull(
              `${value.name}:${value.tag}`,
              (err: string, stream: { pipe: (arg0: NodeJS.WriteStream) => void }) => {
                this.docker.modem.followProgress(stream, () => {
                  console.info(`Finished pulling image ${value.name}:${value.tag}`);
                  resolve();
                });
              }
            );
          })
      )
    );
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
  async createContainer(project: Project, id: string, image: DockerImage, ports: [string?] = []): Promise<Container> {
    console.info(`${project.id}: Launching container ${image.name}`);

    const options: ContainerCreateOptions = {
      Cmd: [Docker.containerProjectPath(project)],
      Image: `${image.name}:${image.tag}`,
      name: `wpilib-${image.name.replace(/\//g, "_")}-${id}`,
      Labels: {
        wpilib: "ml",
        "wpilib-ml-name": image.name,
        "wpilib-ml-id": id
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

    const container = await this.docker.createContainer(options);
    (await container.attach({ stream: true, stdout: true, stderr: true })).pipe(process.stdout);

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
