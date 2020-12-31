import { DockerImage, Trainjob, TrainStatus } from "../schema/__generated__/graphql";
import { CONTAINER_MOUNT_PATH } from "./Docker";
import { Project, Checkpoint } from "../store";
import { Container } from "dockerode";
import * as rimraf from "rimraf";
import * as mkdirp from "mkdirp";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";

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

  private container: Container;
  private status: TrainStatus;
  private lastEpoch: number;
  readonly project: Project;
  readonly docker: Docker;
  private paused: boolean;
  private epoch: number;

  public constructor(docker: Docker, project: Project) {
    this.lastEpoch = project.epochs;
    this.status = TrainStatus.Idle;
    this.project = project;
    this.docker = docker;
    this.epoch = 0;
  }

  /**
   * Create the training parameter file in the container's mounted directory to control the container.
   */
  public async writeParameterFile(): Promise<void> {
    do if (this.status == TrainStatus.Stopped) return;
    while (this.paused);

    this.status = TrainStatus.Writing;

    const DATASETPATHS = (await this.project.getDatasets()).map((dataset) =>
      path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path))
    );

    const INITCKPT =
      this.project.initialCheckpoint !== "default"
        ? path.posix.join("checkpoints", this.project.initialCheckpoint)
        : this.project.initialCheckpoint;

    const trainParameters: TrainParameters = {
      "eval-frequency": this.project.evalFrequency,
      "percent-eval": this.project.percentEval,
      "batch-size": this.project.batchSize,
      "dataset-path": DATASETPATHS,
      name: this.project.name,
      epochs: this.lastEpoch,
      checkpoint: INITCKPT
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.project.directory, "hyperparameters.json");
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(trainParameters));
  }

  /**
   * Clean the container's mounted directory if a training has already taken place.
   */
  public async handleOldData(): Promise<void> {
    do if (this.status == TrainStatus.Stopped) return;
    while (this.paused);

    this.status = TrainStatus.Cleaning;

    /* remove old train dir to clear eval files */
    const OLD_TRAIN_DIR = path.posix.join(this.project.directory, "train");
    if (fs.existsSync(OLD_TRAIN_DIR)) {
      await new Promise((resolve) => rimraf(OLD_TRAIN_DIR, resolve));
      console.log(`old train dir ${OLD_TRAIN_DIR} removed`);
    }

    /* get rid of old metrics file so the old metrics are not read */
    const OLD_METRICS_FILE = path.posix.join(this.project.directory, "metrics.json");
    if (fs.existsSync(OLD_METRICS_FILE)) {
      fs.unlinkSync(OLD_METRICS_FILE);
    }

    const project = await Project.findByPk(this.project.id);
    await project.setCheckpoints([]);
  }

  /**
   * Move datasets and custom initial checkpoints to the mounted directory.
   */
  public async moveDataToMount(): Promise<void> {
    do if (this.status == TrainStatus.Stopped) return;
    while (this.paused);

    this.status = TrainStatus.Moving;

    for (const dataset of await this.project.getDatasets())
      await fs.promises.copyFile(
        path.posix.join("data", dataset.path),
        path.posix.join(this.project.directory, "dataset", path.basename(dataset.path))
      );
    console.log("datasets copied");

    //custom checkpoints not yet supported by gui
    if (this.project.initialCheckpoint != "default") {
      if (!fs.existsSync(path.posix.join(this.project.directory, "checkpoints")))
        await mkdirp(path.posix.join(this.project.directory, "checkpoints"));

      const ckptPath = path.posix.join("data", "checkpoints", this.project.initialCheckpoint);
      const ckptMount = path.posix.join(this.project.directory, "checkpoints", this.project.initialCheckpoint);
      await Trainer.copyCheckpoint(ckptPath, ckptMount);
    }
  }

  /**
   * Extracts the dataset file so that the dataset can be used by the training container.
   */
  public async extractDataset(): Promise<void> {
    do if (this.status == TrainStatus.Stopped) return;
    while (this.paused);

    this.status = TrainStatus.Extracting;

    console.info(`${this.project.id}: Trainer extracting dataset`);
    this.container = await this.docker.createContainer(this.project, Trainer.images.dataset);
    await this.docker.runContainer(this.container);
    console.info(`${this.project.id}: Trainer extracted dataset`);
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async trainModel(): Promise<void> {
    do if (this.status == TrainStatus.Stopped) return;
    while (this.paused);

    this.status = TrainStatus.Training;

    const metricsContainer = await this.docker.createContainer(this.project, Trainer.images.metrics, ["6006/tcp"]);
    this.container = await this.docker.createContainer(this.project, Trainer.images.train);
    await metricsContainer.start();
    await this.docker.runContainer(this.container);
    await metricsContainer.stop();
    await metricsContainer.remove();
  }

  /**
   * Read the training metrics file and save the metrics in checkpoint objects in the project.
   * Updates the database with the latest checkpoints.
   */
  public async updateCheckpoints(): Promise<void> {
    const METRICSPATH = path.posix.join(this.project.directory, "metrics.json");
    if (fs.existsSync(METRICSPATH)) {
      const project = await Project.findByPk(this.project.id);

      const metrics = JSON.parse(fs.readFileSync(METRICSPATH, "utf8"));
      while (Object.keys(metrics.precision).length > (await project.getCheckpoints()).length) {
        const CURRENT_CKPT = (await project.getCheckpoints()).length;
        const step = parseInt(Object.keys(metrics.precision)[CURRENT_CKPT]);
        this.epoch = step;
        console.log(step);

        const checkpoint = Checkpoint.build({
          step: step,
          name: `ckpt${step}`,
          precision: metrics.precision[step]
        });

        const ckptDir = `${this.project.directory}/checkpoints/${checkpoint.id}/`;
        checkpoint.path = path.posix.join(ckptDir, `model.ckpt-${step}`);
        await mkdirp(ckptDir);

        const ckptSrcPath = path.posix.join(this.project.directory, "train", `model.ckpt-${step}`);
        await Trainer.copyCheckpoint(ckptSrcPath, checkpoint.path);

        await checkpoint.save();
        await project.addCheckpoint(checkpoint);
      }
    } else this.epoch = 0;
  }

  /**
   * Copies a checkpoint's three files to the desired directory.
   *
   * @param sourcePath The full path to the checkpoint, without the file extention. This is because the checkpoint files have 3 different file extentions, with the same basename.
   * @param destPath The full path to the checpoints destination, without the file extentions.
   */
  public static async copyCheckpoint(sourcePath: string, destPath: string): Promise<void> {
    async function copyCheckpointFile(extention: string): Promise<void> {
      return fs.promises.copyFile(sourcePath.concat(extention), destPath.concat(extention));
    }
    await Promise.all([
      copyCheckpointFile(".data-00000-of-00001"),
      copyCheckpointFile(".index"),
      copyCheckpointFile(".meta")
    ]);
  }

  public async stop(): Promise<void> {
    if (this.container && (await this.container.inspect()).State.Running) await this.container.kill({ force: true });
    this.status = TrainStatus.Stopped;
  }

  public async pause(): Promise<void> {
    if (this.container && (await this.container.inspect()).State.Running) this.container.pause();
    this.paused = true;
  }

  public async resume(): Promise<void> {
    if (this.container) if ((await this.container.inspect()).State.Paused) this.container.unpause();
    this.paused = false;
  }

  public getJob(): Trainjob {
    const state = this.paused ? TrainStatus.Paused : this.status;
    return {
      status: state,
      projectID: this.project.id,
      currentEpoch: this.epoch,
      lastEpoch: this.lastEpoch
    };
  }
}
