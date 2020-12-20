import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import { Project } from "../store";
import { PROJECT_DATA_DIR } from "../constants";
import { Checkpoint, Export, ProjectStatus } from "../schema/__generated__/graphql";

import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import Trainer from "./Trainer";
import Exporter from "./Exporter";
import Docker from "./Docker";

export const DATASET_IMAGE = "gcperkins/wpilib-ml-dataset:latest";
export const METRICS_IMAGE = "gcperkins/wpilib-ml-metrics:latest";
export const EXPORT_IMAGE = "gcperkins/wpilib-ml-tflite:latest";
export const TRAIN_IMAGE = "gcperkins/wpilib-ml-train:latest";
export const TEST_IMAGE = "gcperkins/wpilib-ml-test:latest";

//trainer state enumeration
enum TrainerState {
  NO_DOCKER_INSTALLED,
  SCANNING_FOR_DOCKER,
  SCANNING_PROJECTS,
  DATASET_PULL,
  METRICS_PULL,
  TRAINER_PULL,
  EXPORT_PULL,
  TEST_PULL,
  READY
}

//training status enumeration
export enum TrainingStatus {
  NOT_TRAINING,
  PREPARING,
  TRAINING,
  PAUSED
}

type ProjectStati = {
  [id: string]: ProjectStatus;
};

export default class MLService {
  projects: ProjectData;
  trainer_state: TrainerState;
  status: ProjectStati;

  constructor() {
    this.trainer_state = TrainerState.SCANNING_FOR_DOCKER;
    this.status = {};
    this.prepare();
  }

  private async prepare(): Promise<void> {
    if (!(await Docker.testDaemon())) {
      this.trainer_state = TrainerState.NO_DOCKER_INSTALLED;
      console.log("docker is not responding");
      Promise.resolve();
      return;
    }

    this.trainer_state = TrainerState.SCANNING_PROJECTS;
    const database = await PseudoDatabase.retrieveDatabase();
    Object.values(database).forEach((project: ProjectData) => this.addStatus(project));

    this.trainer_state = TrainerState.DATASET_PULL;
    await Docker.pull(DATASET_IMAGE);

    this.trainer_state = TrainerState.METRICS_PULL;
    await Docker.pull(METRICS_IMAGE);

    this.trainer_state = TrainerState.TRAINER_PULL;
    await Docker.pull(TRAIN_IMAGE);

    this.trainer_state = TrainerState.EXPORT_PULL;
    await Docker.pull(EXPORT_IMAGE);

    this.trainer_state = TrainerState.TEST_PULL;
    await Docker.pull(TEST_IMAGE);

    this.trainer_state = TrainerState.READY;
    console.log("image pull complete");
    Promise.resolve();
  }

  async start(iproject: Project): Promise<string> {
    const ID = iproject.id;

    const project = await PseudoDatabase.retrieveProject(ID);

    const MOUNT = project.directory;
    this.updateLastStep(ID, project.hyperparameters.epochs);
    this.updateState(ID, TrainingStatus.PREPARING);

    await Trainer.writeParameterFile(ID);

    await Trainer.handleOldData(ID);

    await Trainer.moveDataToMount(ID);

    console.log("extracting the dataset");

    project.containerIDs.metrics = await Docker.createContainer(METRICS_IMAGE, "METRICS-", ID, MOUNT, "6006");
    project.containerIDs.train = await Docker.createContainer(DATASET_IMAGE, "TRAIN-", ID, MOUNT);

    await Docker.runContainer(project.containerIDs.train);
    console.log("datasets extracted");

    this.updateState(ID, TrainingStatus.TRAINING);
    this.updateStep(ID, 0);

    project.containerIDs.train = await Docker.createContainer(TRAIN_IMAGE, "TRAIN-", ID, MOUNT);

    await Docker.startContainer(project.containerIDs.metrics);

    await Docker.runContainer(project.containerIDs.train);

    await Docker.removeContainer(project.containerIDs.metrics);

    this.updateState(ID, TrainingStatus.NOT_TRAINING);
    project.containerIDs.train = null;
    PseudoDatabase.pushProject(project);
    return "training complete";
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    const MOUNT = project.directory;

    const EXPORT_PATH = path.posix.join(MOUNT, "exports", name);
    const TAR_PATH = path.posix.join(EXPORT_PATH, `${name}.tar.gz`);

    if (!fs.existsSync(path.posix.join(MOUNT, "train", `model.ckpt-${checkpointNumber}.meta`))) {
      Promise.reject("cannot find requested checkpoint");
      return;
    }

    //line below is needed eventually but not possible until tflite container is changed.
    // await Exporter.moveCheckpointToMount(MOUNT, checkpointNumber, EXPORT_PATH);
    await mkdirp(path.posix.join(EXPORT_PATH, "checkpoint"));

    await Trainer.UpdateCheckpoints(id); // <-- get rid of soon

    await Exporter.updateCheckpointStatus(id, checkpointNumber, true);

    await Exporter.writeParameterFile(name, checkpointNumber, MOUNT);

    project.containerIDs.export = await Docker.createContainer(EXPORT_IMAGE, "EXPORT-", id, MOUNT);
    await Docker.runContainer(project.containerIDs.export);
    project.containerIDs.export = null;

    project.exports[name] = {
      projectId: id,
      name: name,
      directory: EXPORT_PATH,
      tarPath: TAR_PATH
    };
    project.checkpoints[checkpointNumber].status.exportPaths.push(TAR_PATH);
    PseudoDatabase.pushProject(project);

    await Exporter.updateCheckpointStatus(id, checkpointNumber, false);

    return "exported";
  }

  async test(modelExport: Export, videoPath: string, videoFilename: string, videoCustomName: string): Promise<string> {
    // const ID = modelExport.projectId;
    // const MOUNT = this.projects[ID].directory;

    // const MOUNTED_MODEL_DIR = path.posix.join(MOUNT, "exports", modelExport.name);
    // const MOUNTED_MODEL_PATH = path.posix.join(MOUNTED_MODEL_DIR, `${modelExport.name}.tar.gz`);
    // const CONTAINER_MODEL_PATH = path.posix.join(
    //   CONTAINER_MOUNT_PATH,
    //   "exports",
    //   modelExport.name,
    //   `${modelExport.name}.tar.gz`
    // );

    // const MOUNTED_VIDEO_PATH = path.posix.join(MOUNT, "videos", videoFilename);
    // const CONTAINER_VIDEO_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "videos", videoFilename);

    // if (!fs.existsSync(modelExport.tarPath)) {
    //   Promise.reject("model not found");
    //   return;
    // }
    // if (!fs.existsSync(videoPath)) {
    //   Promise.reject("video not found");
    //   return;
    // }

    // this.projects[ID].exports[modelExport.name].testingInProgress = true;

    // if (!fs.existsSync(MOUNTED_MODEL_PATH)) {
    //   await fs.promises.copyFile(modelExport.tarPath, MOUNTED_MODEL_PATH);
    // }
    // if (!fs.existsSync(MOUNTED_VIDEO_PATH)) {
    //   await fs.promises.copyFile(videoPath, MOUNTED_VIDEO_PATH);
    // }
    // const testparameters = {
    //   "test-video": CONTAINER_VIDEO_PATH,
    //   "model-tar": CONTAINER_MODEL_PATH
    // };
    // fs.writeFileSync(path.posix.join(MOUNT, "testparameters.json"), JSON.stringify(testparameters));

    // this.projects[ID].containers.test = await this.createContainer(TEST_IMAGE, "TEST-", ID, MOUNT, "5000");
    // await this.projects[ID].containers.test.start();
    // await this.projects[ID].containers.test.wait();
    // await this.projects[ID].containers.test.remove();

    // const OUTPUT_VID_PATH = path.posix.join(MOUNT, "inference.mp4");
    // if (!fs.existsSync(OUTPUT_VID_PATH)) return "cant find output video";

    // const CUSTOM_VID_DIR = path.posix.join(MOUNTED_MODEL_DIR, "tests", videoCustomName);
    // const CUSTOM_VID_PATH = path.posix.join(CUSTOM_VID_DIR, `${videoCustomName}.mp4`);
    // await mkdirp(CUSTOM_VID_DIR);
    // await fs.promises.copyFile(OUTPUT_VID_PATH, CUSTOM_VID_PATH);

    // this.projects[ID].containers.test = null;
    // this.projects[ID].exports[modelExport.name].testingInProgress = false;
    return "testing complete";
  }

  async halt(id: string): Promise<void> {
    if (this.projects[id].containers.train) {
      if ((await this.projects[id].containers.train.inspect()).State.Running) {
        await this.projects[id].containers.train.kill({ force: true });
      }
    }
    this.projects[id].status.trainingStatus = TrainingStatus.NOT_TRAINING;
    Promise.resolve();
  }

  public async getStatus(id: string): Promise<ProjectStatus> {
    return this.status[id];

    /* status remains if app exits poorly */
    // if (project.status.trainingStatus != TrainingStatus.NOT_TRAINING) {
    //   let container : Container = null;
    //   try {container =this.docker.getContainer(project.containers.train.id);}
    //   catch(err){console.log(err);}
    //   if (container == null) correctStatus();
    //   else switch (project.status.trainingStatus){
    //     case TrainingStatus.PAUSED:
    //       if ((await container.inspect()).State.Paused) break
    //       await container.kill({ force: true });
    //     case TrainingStatus.PREPARING:
    //     case TrainingStatus.TRAINING:
    //       if ((await container.inspect()).State.Running) break
    //       await container.remove();
    //       correctStatus();
    //   }
    // }
    // async function correctStatus(): Promise<void> {
    //   project.containers.train = null;
    //   project.status.trainingStatus = TrainingStatus.NOT_TRAINING;
    //   PseudoDatabase.pushProject(project);
    // }
  }

  public async updateCheckpoints(id: string): Promise<void> {
    const currentStep = await Trainer.UpdateCheckpoints(id);
    if (currentStep) this.updateStep(id, currentStep);
    Promise.resolve();
  }

  public async getCheckpoints(id: string): Promise<Checkpoint[]> {
    const project = await PseudoDatabase.retrieveProject(id);
    return Object.values(project.checkpoints);
  }

  public async getExports(id: string): Promise<Export[]> {
    const project = await PseudoDatabase.retrieveProject(id);
    return Object.values(project.exports);
  }

  public addStatus(project: ProjectData): void {
    this.status[project.id] = {
      trainingStatus: TrainingStatus.NOT_TRAINING,
      currentEpoch: 0,
      lastEpoch: project.hyperparameters.epochs
    };
  }
  public updateState(id: string, newState: TrainingStatus): void {
    this.status[id].trainingStatus = newState;
  }
  public updateStep(id: string, newStep: number): void {
    this.status[id].currentEpoch = newStep;
  }
  public updateLastStep(id: string, newLast: number): void {
    this.status[id].lastEpoch = newLast;
  }
}
