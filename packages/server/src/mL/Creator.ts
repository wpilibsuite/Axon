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

  private container: Container;
  private status: TrainStatus;
  readonly docker: Docker;
  readonly directory: string;

  public constructor(docker: Docker, classes: string[], maxImages: number, directory: string) {
    this.status = TrainStatus.Idle;
    this.docker = docker;
    this.classes = classes;
    this.maxImages = maxImages;
    this.directory = directory;
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

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.directory, "hyperparameters.json");
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(createParameters));
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async trainModel(): Promise<void> {
    this.status = TrainStatus.Training;

    const metricsContainer = await this.docker.createContainerProjectless(
      this.directory,
      this.id,
      Trainer.images.metrics,
      ["6006/tcp"]
    );
    this.container = await this.docker.createContainer(this.project, this.project.id, Trainer.images.train);

    await metricsContainer.start();
    await this.docker.runContainer(this.container);

    if ((await metricsContainer.inspect()).State.Running) {
      await metricsContainer.stop();
    }
    await metricsContainer.remove();

    this.status = TrainStatus.Stopped;
  }

  /**
   * Calls updateCheckpoints every 10 seconds until training is stopped.
   */
  public async startCheckpointRoutine(): Promise<void> {
    const UPDATE_INTERVAL = 10000;
    while (this.status !== TrainStatus.Stopped) {
      await new Promise((resolve) => setTimeout(resolve, UPDATE_INTERVAL));
      await this.updateCheckpoints();
    }
    /* wait for any late metrics container parse and update one last time */
    await new Promise((resolve) => setTimeout(resolve, UPDATE_INTERVAL));
    await this.updateCheckpoints();
    console.log("Checkpoint update routine terminated.");
  }

  /**
   * Read the training metrics file and save the metrics in checkpoint objects in the project.
   * Updates the database with the latest checkpoints.
   */
  private async updateCheckpoints(): Promise<void> {
    const METRICSPATH = path.posix.join(this.project.directory, "metrics.json");
    if (fs.existsSync(METRICSPATH)) {
      const metrics = JSON.parse(fs.readFileSync(METRICSPATH, "utf8"));
      const jssteps: number[] = Object.keys(metrics.precision).map((s) => parseInt(s)); //we must change the metrics.json soon
      this.epoch = jssteps.length > 0 ? jssteps.sort()[jssteps.length - 1] : 0;
      const dbsteps: number[] = (await this.project.getCheckpoints()).map((ckpt) => ckpt.step);

      for (const jsonstep of jssteps) {
        if (!dbsteps.includes(jsonstep)) {
          const checkpoint = Checkpoint.build({
            step: jsonstep,
            name: `ckpt${jsonstep}`,
            precision: metrics.precision[jsonstep.toString()]
          });
          const relativeDir = path.posix.join("checkpoints", checkpoint.id);
          checkpoint.relativePath = path.posix.join(relativeDir, `model.ckpt-${jsonstep}`);
          checkpoint.fullPath = path.posix.join(this.project.directory, checkpoint.relativePath);
          await mkdirp(path.posix.join(this.project.directory, relativeDir));

          const ckptSrcPath = path.posix.join(this.project.directory, "train", `model.ckpt-${jsonstep}`);

          await checkpoint.save();
          await this.project.addCheckpoint(checkpoint);
          await Trainer.copyCheckpoint(ckptSrcPath, checkpoint.fullPath);
          return;
        }
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
    if (this.container && (await this.container.inspect()).State.Running) this.container.kill({ force: true });
    this.status = TrainStatus.Stopped;
  }

  public async pause(): Promise<void> {
    if (this.status == TrainStatus.Stopped) return console.log("Cannot pause, training has stopped.");

    if (this.container && (await this.container.inspect()).State.Running) this.container.pause();
    this.paused = true;
  }

  public async resume(): Promise<void> {
    if (this.status == TrainStatus.Stopped) return console.log("Cannot resume, training has stopped.");

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

  /**
   * True if status has been set to stopped, false if otherwise. If status is paused, wait a bit before returning.
   */
  private async stopped(): Promise<boolean> {
    if (this.status === TrainStatus.Stopped) return true;
    if (this.status === TrainStatus.Paused) await new Promise((resolve) => setTimeout(resolve, 1000));
    return false;
  }
}
