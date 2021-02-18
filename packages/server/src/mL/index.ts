import { Trainjob, Exportjob, Testjob, Test, DockerState } from "../schema/__generated__/graphql";
import { Project } from "../store";
import Exporter from "./Exporter";
import Trainer from "./Trainer";
import Tester from "./Tester";
import Docker from "./Docker";

export default class MLService {
  private dockerState: DockerState;
  private exportjobs: Exporter[];
  private trainjobs: Trainer[];
  private testjobs: Tester[];
  readonly docker: Docker;

  constructor(docker: Docker) {
    this.docker = docker;
    this.exportjobs = [];
    this.trainjobs = [];
    this.testjobs = [];
    this.initialize();
  }

  /**
   * check if docker is connected,
   * pull docker images.
   */
  async initialize(): Promise<void> {
    this.dockerState = DockerState.ScanningForDocker;
    if (!(await this.docker.isConnected())) {
      this.dockerState = DockerState.NoDocker;
      console.log("Docker not connected.");
      return;
    }

    await this.docker.reset();

    this.dockerState = DockerState.TrainPull;
    await this.docker.pullImages(Object.values(Trainer.images));

    this.dockerState = DockerState.ExportPull;
    await this.docker.pullImages(Object.values(Exporter.images));

    this.dockerState = DockerState.TestPull;
    await this.docker.pullImages(Object.values(Tester.images));

    this.dockerState = DockerState.Ready;
  }

  /**
   * Train a model based on the parameters in the given project.
   *
   * @param project The model's project.
   */
  async start(project: Project): Promise<void> {
    console.info(`${project.id}: Starting training`);
    const trainer = new Trainer(this.docker, project);
    this.trainjobs.push(trainer);

    await trainer.writeParameterFile();

    await trainer.handleOldData();

    await trainer.moveDataToMount();

    await trainer.extractDataset();

    trainer.startCheckpointRoutine();

    await trainer.trainModel();

    this.trainjobs = this.trainjobs.filter((job) => job !== trainer);
    console.info(`${project.id}: Training complete`);
  }

  /**
   * Export a checkpoint to a tflite model.
   *
   * @param project The checkpoint's project
   * @param checkpointID The ID of the checkpoint to be exported.
   * @param name The desired name of the exported file.
   */
  async export(project: Project, checkpointID: string): Promise<void> {
    const name = `${project.name}-${(await project.getExports()).length}`;
    const exporter: Exporter = new Exporter(project, this.docker, checkpointID, name);
    this.exportjobs.push(exporter);

    await exporter.createDestinationDirectory();

    await exporter.writeParameterFile();

    await exporter.exportCheckpoint();

    await exporter.saveExport();

    this.exportjobs = this.exportjobs.filter((job) => job !== exporter);
    console.info(`${exporter.exp.id}: Export complete`);
  }

  /**
   * Test an exported model on a provided video.
   *
   * @param name Desired name of the test.
   * @param projectID The test project's id.
   * @param exportID The id of the export to be tested.
   * @param videoID The id of the video to be used in the test
   */
  async test(name: string, project: Project, exportID: string, videoID: string): Promise<void> {
    const tester: Tester = new Tester(project, this.docker, "5000", name, exportID, videoID);
    this.testjobs.push(tester);

    const mountedModelPath = await tester.mountModel();

    const mountedVideoPath = await tester.mountVideo();

    await tester.writeParameterFile(mountedModelPath, mountedVideoPath);

    await tester.testModel();

    await tester.saveOutputVid();

    await tester.saveTest();

    this.testjobs = this.testjobs.filter((job) => job !== tester);
    console.info(`${tester.test.id}: Test complete`);
  }

  /**
   * Stop the training of a project.
   * Can only be resumed from an eval checkpoint.
   *
   * @param project The project whos training will be stopped.
   */
  async stopTraining(project: Project): Promise<void> {
    const job = this.trainjobs.find((job) => job.project.id === project.id);
    if (job === undefined) console.log("No trainjob found.");
    else await job.stop();
  }

  /**
   * Stop the testing of an export..
   *
   * @param testID The testID to be stopped.
   */
  async stopTesting(testID: string): Promise<Test> {
    const job = this.testjobs.find((job) => job.test.id === testID);
    if (job === undefined) console.log("No testjob found.");
    else return job.stop();
  }

  /**
   * Pause the training of a project.
   * Can be easily resumed.
   *
   * @param project The project whos training will be paused.
   */
  async pauseTraining(project: Project): Promise<void> {
    const job = this.trainjobs.find((job) => job.project.id === project.id);
    if (job === undefined) console.log("No trainjob found.");
    else await job.pause();
  }

  /**
   * Resume a paused trainjob of a project.
   *
   * @param project The project whos training will be resumed.
   */
  async resumeTraining(project: Project): Promise<void> {
    const job = this.trainjobs.find((job) => job.project.id === project.id);
    if (job === undefined) console.log("No trainjob found.");
    else await job.resume();
  }

  public async getTrainjobs(): Promise<Trainjob[]> {
    return this.trainjobs.map((job) => job.getJob());
  }

  public async getExportjobs(): Promise<Exportjob[]> {
    return this.exportjobs.map((job) => job.getJob());
  }

  public async getTestjobs(): Promise<Testjob[]> {
    return this.testjobs.map((job) => job.getJob());
  }

  public getDockerState(): DockerState {
    return this.dockerState;
  }
}
