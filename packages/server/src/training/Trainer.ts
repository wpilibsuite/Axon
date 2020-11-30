import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import { Project } from "../store";
import { Container } from "dockerode";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

import { CONTAINER_MOUNT_PATH } from "./index";

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
      fs.rmdirSync(OLD_TRAIN_DIR, { recursive: true });
      console.log("old train dir removed");
    } //if this project has already trained, we must get rid of the evaluation files in order to only get new metrics

    const OLD_METRICS_DIR = path.posix.join(project.directory, "metrics.json");
    if (fs.existsSync(OLD_METRICS_DIR)) {
      fs.unlinkSync(OLD_METRICS_DIR);
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

  public static async runContainer(container: Container): Promise<void> {
    await container.start();
    await container.wait();
    await container.remove();
    Promise.resolve();
  }

  public static async UpdateCheckpoints(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

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
            exportPaths: []
          }
        };
        project.status.currentEpoch = parseInt(step, 10);

        await PseudoDatabase.pushProject(project);
      }
    } else project.status.currentEpoch = 0;

    Promise.resolve();
  }
}
