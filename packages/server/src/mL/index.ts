import { Test, Video, Checkpoint, Export, ProjectStatus } from "../schema/__generated__/graphql";
import { Project } from "../store";

import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import Trainer from "./Trainer";
import Exporter from "./Exporter";
import Tester from "./Tester";
import Docker from "./Docker";

//training status enumeration
export enum TrainingStatus {
  NOT_TRAINING,
  PREPARING,
  TRAINING,
  PAUSED
}

export enum DockerState {
  NO_DOCKER,
  SCANNING_FOR_DOCKER,
  TRAIN_PULL,
  EXPORT_PULL,
  TEST_PULL,
  READY
}

type ProjectStati = {
  [id: string]: ProjectStatus;
};

export default class MLService {
  readonly docker: Docker;
  private dockerState: DockerState;
  private status: ProjectStati;

  constructor(docker: Docker) {
    this.docker = docker;
    this.status = {};
    this.initialize();
  }

  async initialize(): Promise<void> {
    const database = await PseudoDatabase.retrieveDatabase();
    for (const id in database) {
      this.status[id] = {
        trainingStatus: TrainingStatus.NOT_TRAINING,
        currentEpoch: 0,
        lastEpoch: 0
      };
    }

    this.dockerState = DockerState.SCANNING_FOR_DOCKER;
    if (!(await this.docker.isConnected())) {
      this.dockerState = DockerState.NO_DOCKER;
      return Promise.resolve();
    }

    this.dockerState = DockerState.TRAIN_PULL;
    await this.docker.pullImages(Object.values(Trainer.images));

    this.dockerState = DockerState.EXPORT_PULL;
    await this.docker.pullImages(Object.values(Exporter.images));

    this.dockerState = DockerState.TEST_PULL;
    await this.docker.pullImages(Object.values(Tester.images));

    this.dockerState = DockerState.READY;
  }

  async start(iproject: Project): Promise<void> {
    console.info(`${iproject.id}: Starting training`);
    const project = await PseudoDatabase.retrieveProject(iproject.id);

    const trainer = new Trainer(this.docker, project);

    this.updateLastStep(project.id, project.hyperparameters.epochs);
    this.updateState(project.id, TrainingStatus.PREPARING);

    await trainer.writeParameterFile();

    await trainer.handleOldData();

    await trainer.moveDataToMount();

    await trainer.extractDataset();

    this.updateState(project.id, TrainingStatus.TRAINING);
    this.updateStep(project.id, 0);

    await trainer.trainModel();

    await Trainer.updateCheckpoints(project.id);

    this.updateState(project.id, TrainingStatus.NOT_TRAINING);
    project.containerIDs.train = null;
    PseudoDatabase.pushProject(project);

    console.info(`${iproject.id}: Training complete`);
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const project = await PseudoDatabase.retrieveProject(id);
    const exporter: Exporter = new Exporter(project, this.docker);

    await exporter.locateCheckpoint(checkpointNumber);

    await exporter.createExport(name);

    await exporter.createDestinationDirectory();

    await exporter.updateCheckpointStatus(checkpointNumber, true);

    await exporter.writeParameterFile(checkpointNumber);

    await exporter.exportCheckpoint();

    await exporter.saveExport(checkpointNumber);

    await exporter.updateCheckpointStatus(checkpointNumber, false);

    return "exported";
  }

  async test(testName: string, projectID: string, exportID: string, videoID: string): Promise<string> {
    const project = await PseudoDatabase.retrieveProject(projectID);
    const tester: Tester = new Tester(project, this.docker);

    await tester.createTest(testName, exportID, videoID);

    const mountedModelPath = await tester.mountModel();

    const mountedVideoPath = await tester.mountVideo();

    await tester.writeParameterFile(mountedModelPath, mountedVideoPath);

    await tester.testModel();

    await tester.saveOutputVid();

    await tester.saveTest();

    return "testing complete";
  }

  async halt(id: string): Promise<void> {
    // const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    // if (project.containerIDs.train) await Docker.killContainer(project.containerIDs.train);
    // else return Promise.reject("no trainjob found");
    // this.status[project.id].trainingStatus = TrainingStatus.NOT_TRAINING;
  }

  async pauseTraining(id: string): Promise<void> {
    // const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    // if (this.status[id].trainingStatus == TrainingStatus.PAUSED) return Promise.reject("training is already paused");
    // if (project.containerIDs.train == null) return Promise.reject("no trainjob found");
    // await Docker.pauseContainer(project.containerIDs.train);
    // this.status[project.id].trainingStatus = TrainingStatus.PAUSED;
  }

  async resumeTraining(id: string): Promise<void> {
    // const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    // if (this.status[id].trainingStatus != TrainingStatus.PAUSED) return Promise.reject("training is not paused");
    // if (project.containerIDs.train == null) return Promise.reject("no trainjob found");
    // await Docker.resumeContainer(project.containerIDs.train);
    // this.status[project.id].trainingStatus = TrainingStatus.TRAINING;
  }

  public async getStatus(id: string): Promise<ProjectStatus> {
    return this.status[id];
  }

  public getDockerState(): DockerState {
    return this.dockerState;
  }

  public async updateCheckpoints(id: string): Promise<void> {
    const currentStep = await Trainer.updateCheckpoints(id);
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

  public async getVideos(id: string): Promise<Video[]> {
    const project = await PseudoDatabase.retrieveProject(id);
    return Object.values(project.videos);
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
