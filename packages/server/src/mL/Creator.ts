import { DockerImage, TrainStatus } from "../schema/__generated__/graphql";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";

type CreateParameters = {
  labels: string[];
  limit: number;
};

export default class Creator {
  static readonly images: Record<string, DockerImage> = {
    openimages: { name: "wpilib/axon-openimages", tag: process.env.AXON_VERSION || "edge" }
  };

  readonly classes: string[];
  readonly maxImages: number;
  readonly docker: Docker;
  readonly directory: string;
  readonly id: string;

  public constructor(docker: Docker, classes: string[], maxImages: number, id: string) {
    this.docker = docker;
    this.classes = classes;
    this.maxImages = maxImages;
    this.directory = `data/create/${id}`;
    this.id = id;
  }

  /**
   * Create the training parameter file in the container's mounted directory to control the container.
   */
  public async writeParameterFile(): Promise<void> {
    const createParameters: CreateParameters = {
      labels: this.classes,
      limit: this.maxImages
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.directory, "data.json");
    console.log(`Create config data created at ${HYPERPARAMETER_FILE_PATH}`);
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(createParameters));
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async createDataset(): Promise<void> {
    const container = await this.docker.createContainerProjectless(`${this.id}`, this.id, Creator.images.openimages);
    await this.docker.runContainer(container);
  }
}
