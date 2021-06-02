import { DatasetCreateStatus, DockerImage, Trainjob, TrainStatus } from "../schema/__generated__/graphql";
import Docker from "./Docker";
import { Project, Checkpoint } from "../store";
import { Container } from "dockerode";
import * as rimraf from "rimraf";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";

type DatasetCreateParameters = {
  "classes": string[];
  "max-images": number;
};

export default class DatasetCreator {
  static readonly images: Record<string, DockerImage> = {
    openimages: { name: "wpilib/axon-openimages", tag: process.env.AXON_VERSION || "edge" }
  };

  private container: Container;
  private status: DatasetCreateStatus;
  readonly docker: Docker;

  public constructor(docker: Docker) {
    this.status = DatasetCreateStatus.Idle;
    this.docker = docker;
  }

  /**
   * Extracts the dataset file so that the dataset can be used by the training container.
   */  public async createDataset(): Promise<void> {

    this.status = DatasetCreateStatus.Downloading;

    console.info(`${this.project.id}: Trainer extracting dataset`);
    this.container = await this.docker.createContainer(this.project, this.project.id, Trainer.images.dataset);
    await this.docker.runContainer(this.container);
    console.info(`${this.project.id}: Trainer extracted dataset`);
  }

}
