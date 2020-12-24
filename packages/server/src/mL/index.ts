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

type ProjectStati = {
  [id: string]: ProjectStatus;
};

export default class MLService {
  readonly docker: Docker;

  projects: ProjectData;
  status: ProjectStati;

  constructor(docker: Docker) {
    this.docker = docker;
    
    this.status = {};
  }

  async pullAllResources(): Promise<void[]> {
    return this.docker.pullImages(Object.values(Trainer.images));
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

    await trainer.updateCheckpoints();

    this.updateState(project.id, TrainingStatus.NOT_TRAINING);
    project.containerIDs.train = null;
    PseudoDatabase.pushProject(project);

    console.info(`${iproject.id}: Training complete`);
  }

  async export(id: string, checkpointNumber: number, name: string): Promise<string> {
    const project = await PseudoDatabase.retrieveProject(id);
    const exporter: Exporter = new Exporter(project, this.docker);

    await exporter.locateCheckpoint(checkpointNumber);

    await Exporter.createExport(name);

    await exporter.createDestinationDirectory(exp);

    await exporter.updateCheckpointStatus(checkpointNumber, true);

    await exporter.writeParameterFile(checkpointNumber);

    await exporter.exportCheckpoint();

    await exporter.saveExport(checkpointNumber);

    await exporter.updateCheckpointStatus(checkpointNumber, false);

    return "exported";
  }

  async test(testName: string, projectID: string, exportID: string, videoID: string): Promise<string> {
    const project = await PseudoDatabase.retrieveProject(id);
    const tester: Tester = new Tester(project, this.docker);

    await tester.createTest(testName, projectID, exportID, videoID);

    const project: ProjectData = await PseudoDatabase.retrieveProject(projectID);

    const mountedModelPath = await tester.mountModel(test, project.directory);

    const mountedVideoPath = await tester.mountVideo(test, project.directory);

    await tester.writeParameterFile(project.directory, mountedModelPath, mountedVideoPath);

    await tester.testModel(project.id);

    await tester.saveOutputVid(test, project.directory);

    await tester.saveTest(test, project.id);

    return "testing complete";
  }

  async halt(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    if (project.containerIDs.train) await Docker.killContainer(project.containerIDs.train);
    else return Promise.reject("no trainjob found");
    this.status[project.id].trainingStatus = TrainingStatus.NOT_TRAINING;
  }

  async pauseTraining(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    if (this.status[id].trainingStatus == TrainingStatus.PAUSED) return Promise.reject("training is already paused");
    if (project.containerIDs.train == null) return Promise.reject("no trainjob found");
    await Docker.pauseContainer(project.containerIDs.train);
    this.status[project.id].trainingStatus = TrainingStatus.PAUSED;
  }

  async resumeTraining(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    if (this.status[id].trainingStatus != TrainingStatus.PAUSED) return Promise.reject("training is not paused");
    if (project.containerIDs.train == null) return Promise.reject("no trainjob found");
    await Docker.resumeContainer(project.containerIDs.train);
    this.status[project.id].trainingStatus = TrainingStatus.TRAINING;
  }

  public async getStatus(id: string): Promise<ProjectStatus> {
    return this.status[id];
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
