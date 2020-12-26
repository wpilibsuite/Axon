import * as Dockerode from "dockerode";
import { Container, ContainerCreateOptions } from "dockerode";
import { PROJECT_DATA_DIR } from "../constants";
import { ProjectData } from "../datasources/PseudoDatabase";
import { DockerImage } from "../schema/__generated__/graphql";

export const CONTAINER_MOUNT_PATH = "/opt/ml/model";

/**
 * Get the working directory of a project.
 *
 * @param project The project to get the working directory of
 */
function getProjectWorkingDirectory(project: ProjectData): string {
  return `${PROJECT_DATA_DIR}/${project.id}`.replace(/\\/g, "/");
}

export default class Docker {
  readonly docker;

  constructor(docker: Dockerode) {
    this.docker = docker;
  }

  /**
   * Get the status of the Docker Service.
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.docker.ping();
    } catch (e) {
      return false;
    }
    return true;
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
    await Promise.all(containers.map(async (container) => this.docker.getContainer(container.Id).stop()));

    return true;
  }

  /**
   * Pull resources needed for training.
   */
  async pullImages(images: DockerImage[]): Promise<void[]> {
    return Promise.all(
      Object.entries(images).map(async ([, value]) => {
        console.info(`Pulling image ${value.name}:${value.tag}`);
        const stream = await this.docker.pull(`${value.name}:${value.tag}`);
        this.docker.modem.followProgress(stream, () =>
          console.info(`Finished pulling image ${value.name}:${value.tag}`)
        );
      })
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
  async createContainer(project: ProjectData, image: DockerImage, ports: [string?] = []): Promise<Container> {
    console.info(`${project.id}: Launching container ${image.name}`);

    const localMountPath = getProjectWorkingDirectory(project).replace("C:\\", "/c/").replace(/\\/g, "/");
    const options: ContainerCreateOptions = {
      Image: `${image.name}:${image.tag}`,
      name: `wpilib-${image.name.replace(/\//g, "_")}-${project.id}`,
      Labels: {
        wpilib: "ml",
        "wpilib-ml-name": image.name,
        "wpilib-ml-id": project.id
      },
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      Tty: true,
      Volumes: { [CONTAINER_MOUNT_PATH]: {} },
      HostConfig: {
        Binds: [`${localMountPath}:${CONTAINER_MOUNT_PATH}:rw`],
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
