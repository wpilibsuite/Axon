import { DockerImage, Trainjob, TrainStatus } from "../schema/__generated__/graphql";
import Docker from "./Docker";
import { Checkpoint } from "../store";
import { Container } from "dockerode";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";

type CreateParameters = {
  classes: string[];
  maxImages: number;
};

export default class Creator {
  static readonly images: Record<string, DockerImage> = {
    openimages: { name: "wpilib/axon-openimages", tag: process.env.AXON_VERSION || "edge" }
  };

  readonly classes: string[];
  readonly maxImages: number;

  private status: TrainStatus;
  readonly docker: Docker;
  readonly directory: string;
  readonly id: string;

  public constructor(docker: Docker, classes: string[], maxImages: number, id: string) {
    this.status = TrainStatus.Idle;
    this.docker = docker;
    this.classes = classes;
    this.maxImages = maxImages;
    this.directory = `/wpi-data/create/${id}`;
    this.id = id;
  }

  /**
   * Create the training parameter file in the container's mounted directory to control the container.
   */
  public async writeParameterFile(): Promise<void> {
    this.status = TrainStatus.Writing;

    const createParameters: CreateParameters = {
      classes: this.classes,
      maxImages: this.maxImages
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.directory, "data.json");
    console.log(`Create config data created at ${HYPERPARAMETER_FILE_PATH}`);
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(createParameters));
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async createDataset(): Promise<void> {
    this.status = TrainStatus.Training;

    const container = await this.docker.createContainerProjectless("/wpi-data", this.id, Creator.images.openimages);

    await this.docker.runContainer(container);
    this.status = TrainStatus.Stopped;
  }
}