import { DATASET_IMAGE, METRICS_IMAGE, TRAIN_IMAGE } from "./index";
import { ProjectData } from "../datasources/PseudoDatabase";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { CONTAINER_MOUNT_PATH } from "./Docker";
import * as mkdirp from "mkdirp";
import * as rimraf from "rimraf";
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
  public static async writeParameterFile(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    const DATASETPATHS = project.datasets.map((dataset) =>
      path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path))
    );

    const INITCKPT =
      project.initialCheckpoint !== "default"
        ? path.posix.join("checkpoints", project.initialCheckpoint)
        : project.initialCheckpoint;

    const trainParameters: TrainParameters = {
      "eval-frequency": project.hyperparameters.evalFrequency,
      "percent-eval": project.hyperparameters.percentEval,
      "batch-size": project.hyperparameters.batchSize,
      "dataset-path": DATASETPATHS,
      epochs: project.hyperparameters.epochs,
      checkpoint: INITCKPT,
      name: project.name
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(project.directory, "hyperparameters.json");
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(trainParameters));

    Promise.resolve();
  }

  public static async handleOldData(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    const OLD_TRAIN_DIR = path.posix.join(project.directory, "train");
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

    const OLD_METRICS_FILE = path.posix.join(project.directory, "metrics.json");
    if (fs.existsSync(OLD_METRICS_FILE)) {
      fs.unlinkSync(OLD_METRICS_FILE);
    } //must clear old checkpoints in order for new ones to be saved by trainer

    project.checkpoints = {}; //must add a way to preserve existing checkpoints somehow

    await PseudoDatabase.pushProject(project);

    Promise.resolve();
  }

  public static async moveDataToMount(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    project.datasets.forEach((dataset) => {
      fs.copyFileSync(
        path.posix.join("data", dataset.path),
        path.posix.join(project.directory, "dataset", path.basename(dataset.path))
      );
    });
    console.log("datasets copied");

    //custom checkpoints not yet supported by gui
    if (project.initialCheckpoint != "default") {
      if (!fs.existsSync(path.posix.join(project.directory, "checkpoints")))
        await mkdirp(path.posix.join(project.directory, "checkpoints"));

      await Promise.all([
        copyCheckpointFile(".data-00000-of-00001"),
        copyCheckpointFile(".index"),
        copyCheckpointFile(".meta")
      ]);
    }

    async function copyCheckpointFile(extention: string): Promise<void> {
      return fs.promises.copyFile(
        path.posix.join("data", "checkpoints", project.initialCheckpoint.concat(extention)),
        path.posix.join(project.directory, "checkpoints", project.initialCheckpoint.concat(extention))
      );
    }
    Promise.resolve();
  }

  public static async extractDataset(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    project.containerIDs.train = await Docker.createContainer(DATASET_IMAGE, "TRAIN-", project.id, project.directory);

    PseudoDatabase.pushProject(project);

    console.log("extracting the dataset");
    await Docker.runContainer(project.containerIDs.train);

    console.log("datasets extracted");
  }

  public static async trainModel(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    project.containerIDs.metrics = await Docker.createContainer(
      METRICS_IMAGE,
      "METRICS-",
      project.id,
      project.directory,
      "6006"
    );
    project.containerIDs.train = await Docker.createContainer(TRAIN_IMAGE, "TRAIN-", project.id, project.directory);
    PseudoDatabase.pushProject(project);
    await Docker.startContainer(project.containerIDs.metrics);
    await Docker.runContainer(project.containerIDs.train);

    await Docker.killContainer(project.containerIDs.metrics);
    await Docker.removeContainer(project.containerIDs.metrics);
  }

  public static async updateCheckpoints(id: string): Promise<number> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    let currentEpoch: number;

    const METRICSPATH = path.posix.join(project.directory, "metrics.json");
    if (fs.existsSync(METRICSPATH)) {
      const metrics = JSON.parse(fs.readFileSync(METRICSPATH, "utf8"));
      while (Object.keys(metrics.precision).length > Object.keys(project.checkpoints).length) {
        const CURRENT_CKPT = Object.keys(project.checkpoints).length;
        const step = Object.keys(metrics.precision)[CURRENT_CKPT];
        project.checkpoints[step] = {
          step: parseInt(step, 10),
          metrics: {
            precision: metrics.precision[step],
            loss: null,
            intersectionOverUnion: null //i will probably push an edit to the metrics container soon to make this easier
          },
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
