import { Video, Checkpoint, Export, ProjectStatus } from "../schema/__generated__/graphql";
import { Project } from "../store";

import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import Trainer from "./Trainer";
import Exporter from "./Exporter";
import Tester from "./Tester";
import Docker from "./Docker";

export enum DockerState {
  NO_DOCKER,
  SCANNING_FOR_DOCKER,
  TRAIN_PULL,
  EXPORT_PULL,
  TEST_PULL,
  READY
}

export default class MLService {
  readonly docker: Docker;
  private dockerState: DockerState;
  private exportJobs: Exporter[];
  private trainJobs: Trainer[];
  private testJobs: Tester[];

  constructor(docker: Docker) {
    this.docker = docker;
    this.exportJobs = [];
    this.trainJobs = [];
    this.testJobs = [];
    this.initialize();
  }

  /**
   * check if docker is connected,
   * pull docker images.
   */
  async initialize(): Promise<void> {
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

  /**
   * Train a model based on the parameters in the given project.
   *
   * @param iproject The model's project.
   */
  async start(iproject: Project): Promise<void> {
    console.info(`${iproject.id}: Starting training`);
    const project: ProjectData = await PseudoDatabase.retrieveProject(iproject.id);
    const trainer = new Trainer(this.docker, project);
    this.trainJobs.push(trainer);

    await trainer.writeParameterFile();

    await trainer.handleOldData();

    await trainer.moveDataToMount();

    await trainer.extractDataset();

    await trainer.trainModel();

    await trainer.updateCheckpoints();

    PseudoDatabase.pushProject(project);
    this.trainJobs = this.trainJobs.filter((job) => job !== trainer);
    console.info(`${iproject.id}: Training complete`);
  }

  /**
   * Export a checkpoint to a tflite model.
   *
   * @param id The id of the checkpoint's project.
   * @param checkpointNumber The epoch of the checkpoint to be exported.
   * @param name The desired name of the exported file.
   */
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

  /**
   * Test an exported model on a provided video.
   *
   * @param testName Desired name of the test.
   * @param projectID The test project's id.
   * @param exportID The id of the export to be tested.
   * @param videoID The id of the video to be used in the test
   */
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

  /**
   * Stop the training of a project.
   * Can only be resumed from an eval checkpoint.
   *
   * @param id The id of the project.
   */
  async halt(id: string): Promise<void> {
    const job = this.trainJobs.find((job) => job.project.id === id);
    if (job === undefined) Promise.reject("no trainjob found");
    await job.stop();
  }

  /**
   * Pause the training of a project.
   * Can be easilly resumed.
   *
   * @param id The id of the project.
   */
  async pauseTraining(id: string): Promise<void> {
    const job = this.trainJobs.find((job) => job.project.id === id);
    if (job === undefined) Promise.reject("no trainjob found");
    await job.pause();
  }

  /**
   * Resume a paused trainjob of a project.
   *
   * @param id The id of the project.
   */
  async resumeTraining(id: string): Promise<void> {
    const job = this.trainJobs.find((job) => job.project.id === id);
    if (job === undefined) Promise.reject("no trainjob found");
    await job.resume();
  }

  public async getStatus(id: string): Promise<ProjectStatus> {
    const job = this.trainJobs.find((job) => job.project.id === id);
    if (job) return job.getStatus();
    else
      return {
        trainingStatus: 0,
        currentEpoch: 0,
        lastEpoch: 0
      };
  }

  public getDockerState(): DockerState {
    return this.dockerState;
  }

  public async updateCheckpoints(id: string): Promise<void> {
    const job = this.trainJobs.find((job) => job.project.id === id);
    if (job) await job.updateCheckpoints();
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

  public printTrainJobs(): void {
    if (this.trainJobs.length === 0) console.log("no jobs");
    this.trainJobs.forEach(console.log);
  }
}
