import { ProjectData } from "../datasources/PseudoDatabase";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { CONTAINER_MOUNT_PATH } from "./Docker";
import * as mkdirp from "mkdirp";
import * as rimraf from "rimraf";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";
import { DockerImage } from "../schema/__generated__/graphql";
import { Container } from "dockerode";

type TrainParameters = {
  "eval-frequency": number;
  "dataset-path": string[];
  "percent-eval": number;
  "batch-size": number;
  checkpoint: string;
  epochs: number;
  name: string;
};

export default class Trainer {
  static readonly images: Record<string, DockerImage> = {
    dataset: { name: "gcperkins/wpilib-ml-dataset", tag: "latest" },
    metrics: { name: "gcperkins/wpilib-ml-metrics", tag: "latest" },
    train: { name: "gcperkins/wpilib-ml-train", tag: "latest" }
  };

  readonly project: ProjectData;
  readonly docker: Docker;

  public constructor(docker: Docker, project: ProjectData) {
    this.project = project;
    this.docker = docker;
  }

  /**
   * Create the training parameter file in the container's mounted directory to control the container.
   */
  public async writeParameterFile(): Promise<void> {
    const DATASETPATHS = this.project.datasets.map((dataset) =>
      path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path))
    );

    const INITCKPT =
      this.project.initialCheckpoint !== "default"
        ? path.posix.join("checkpoints", this.project.initialCheckpoint)
        : this.project.initialCheckpoint;

    const trainParameters: TrainParameters = {
      "eval-frequency": this.project.hyperparameters.evalFrequency,
      "percent-eval": this.project.hyperparameters.percentEval,
      "batch-size": this.project.hyperparameters.batchSize,
      "dataset-path": DATASETPATHS,
      epochs: this.project.hyperparameters.epochs,
      checkpoint: INITCKPT,
      name: this.project.name
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.project.directory, "hyperparameters.json");
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(trainParameters));
  }

  /**
   * Clean the container's mounted directory if a training has already taken place.
   */
  public async handleOldData(): Promise<void> {
    const OLD_TRAIN_DIR = path.posix.join(this.project.directory, "train");
    if (fs.existsSync(OLD_TRAIN_DIR)) {
      try {
        rimraf.sync(OLD_TRAIN_DIR);
      } catch (e) {
        if (e.message.toLowerCase().includes("permission denied"))
          Promise.reject("permission denied when deleting old train directory");
        else throw e;
      }

      console.log(`old train dir ${OLD_TRAIN_DIR} removed`);
    } //if this project has already trained, we must get rid of the evaluation files in order to only get new metrics

    const OLD_METRICS_FILE = path.posix.join(this.project.directory, "metrics.json");
    if (fs.existsSync(OLD_METRICS_FILE)) {
      fs.unlinkSync(OLD_METRICS_FILE);
    } //must clear old checkpoints in order for new ones to be saved by trainer

    this.project.checkpoints = {}; //must add a way to preserve existing checkpoints somehow

    await PseudoDatabase.pushProject(this.project);
  }

  /**
   * Move datasets and custom initial checkpoints to the mounted directory.
   */
  public async moveDataToMount(): Promise<void> {
    this.project.datasets.forEach((dataset) => {
      fs.copyFileSync(
        path.posix.join("data", dataset.path),
        path.posix.join(this.project.directory, "dataset", path.basename(dataset.path))
      );
    });
    console.log("datasets copied");

    //custom checkpoints not yet supported by gui
    if (this.project.initialCheckpoint != "default") {
      if (!fs.existsSync(path.posix.join(this.project.directory, "checkpoints")))
        await mkdirp(path.posix.join(this.project.directory, "checkpoints"));

      await Promise.all([
        copyCheckpointFile(".data-00000-of-00001"),
        copyCheckpointFile(".index"),
        copyCheckpointFile(".meta")
      ]);
    }

    async function copyCheckpointFile(extention: string): Promise<void> {
      return fs.promises.copyFile(
        path.posix.join("data", "checkpoints", this.project.initialCheckpoint.concat(extention)),
        path.posix.join(this.project.directory, "checkpoints", this.project.initialCheckpoint.concat(extention))
      );
    }
  }

  /**
   * Extracts the dataset file so that the dataset can be used by the training container.
   */
  public async extractDataset(): Promise<void> {
    console.info(`${this.project.id}: Trainer extracting dataset`);
    const container: Container = await this.docker.createContainer(this.project, Trainer.images.dataset);
    await this.docker.runContainer(container);
    console.info(`${this.project.id}: Trainer extracted dataset`);
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async trainModel(): Promise<void> {
    const metricsContainer = await this.docker.createContainer(this.project, Trainer.images.metrics, ["6006/tcp"]);
    const trainContainer = await this.docker.createContainer(this.project, Trainer.images.train);
    await metricsContainer.start();
    await this.docker.runContainer(trainContainer);
    await metricsContainer.stop();
    await metricsContainer.remove();
  }

  /**
   * Read the training metrics file and save the metrics in checkpoint objects in the project.
   * Updates the database with the latest checkpoints.
   *
   * @param id The id of the project.
   */
  public static async updateCheckpoints(id: string): Promise<number> {
    const project = await PseudoDatabase.retrieveProject(id);
    let currentEpoch: number;

    const METRICSPATH = path.posix.join(project.directory, "metrics.json");
    if (fs.existsSync(METRICSPATH)) {
      const metrics = JSON.parse(fs.readFileSync(METRICSPATH, "utf8"));
      while (Object.keys(metrics.precision).length > Object.keys(project.checkpoints).length) {
        const CURRENT_CKPT = Object.keys(project.checkpoints).length;
        const step = Object.keys(metrics.precision)[CURRENT_CKPT];
        project.checkpoints[step] = {
          step: parseInt(step, 10),
          metrics: [
            {
              name: "precision",
              value: metrics.precision[step] //only one metric supported now
            }
          ],
          status: {
            exporting: false,
            downloadPaths: []
          }
        };
        currentEpoch = parseInt(step, 10);

        await PseudoDatabase.pushProject(project);
      }
    } else currentEpoch = 0;

    return currentEpoch;
  }
}
