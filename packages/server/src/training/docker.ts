import * as Dockerode from "dockerode";
import { DockerImage } from "../schema/__generated__/graphql";

export class Docker {
  readonly docker = new Dockerode();

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
  async isImagesReady(): Promise<boolean> {
    try {
      await Promise.all(
        Object.entries(DockerTrainer.images).map(async ([, value]) =>
          this.docker.getImage(`${value.name}:${value.tag}`).inspect()
        )
      );
    } catch (e) {
      return false;
    }

    return true;
  }

  async version(): Promise<string> {
    return (await this.docker.version()).Version;
  }

  /**
   * Reset Docker by removing all containers and images.
   */
  async reset(): Promise<boolean> {
    // Stop active containers that we manage
    const containers = await this.docker.listContainers();
    await Promise.all(
      containers
        .filter((container) => Object.values(DockerTrainer.images).some((i) => i.name == container.Image))
        .map(async (container) => this.docker.getContainer(container.Id).stop())
    );

    await this.pullImages();

    return true;
  }

  /**
   * Pull resources needed for training.
   */
  async pullImages(): Promise<void> {
    await Promise.all(
      Object.entries(DockerTrainer.images).map(async ([, value]) => {
        console.info(`Pulling image ${value.name}:${value.tag}`);
        const stream = await this.docker.pull(`${value.name}:${value.tag}`);
        this.docker.modem.followProgress(stream, () =>
          console.info(`Finished pulling image ${value.name}:${value.tag}`)
        );
      })
    );
  }
}

class DockerTrainer {
  static readonly images: Record<string, DockerImage> = {
    dataset: { name: "gcperkins/wpilib-ml-dataset", tag: "latest" },
    metrics: { name: "gcperkins/wpilib-ml-metrics", tag: "latest" },
    export: { name: "gcperkins/wpilib-ml-tflite", tag: "latest" },
    train: { name: "gcperkins/wpilib-ml-train", tag: "latest" },
    test: { name: "gcperkins/wpilib-ml-test", tag: "latest" }
  };
}
