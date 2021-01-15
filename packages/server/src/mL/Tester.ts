import { DockerImage, Testjob } from "../schema/__generated__/graphql";
import { Project, Export, Video, Test } from "../store";
import { Container } from "dockerode";
import * as mkdirp from "mkdirp";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";

export default class Tester {
  static readonly images: Record<string, DockerImage> = {
    test: { name: "wpilib/axon-test", tag: process.env.AXON_VERSION || "edge" }
  };

  private container: Container;
  private streamPort: string;
  readonly project: Project;
  readonly docker: Docker;
  test: Test;

  constructor(project: Project, docker: Docker, port: string, name: string, exportID: string, videoID: string) {
    this.test = this.createTest(name, exportID, videoID, project.directory);
    this.streamPort = port;
    this.project = project;
    this.docker = docker;
  }

  /**
   * Create test object to be stored by the Tester instance and then saved to the database.
   *
   * @param name The desired name of the test, and output video.
   * @param exportID the id of the export to be tested.
   * @param videoID the id of the video to be used for the test.
   * @param projDir the test project's directory.
   */
  public createTest(name: string, exportID: string, videoID: string, projDir: string): Test {
    const test = Test.build({
      exportID: exportID,
      videoID: videoID,
      name: name
    });
    test.directory = path.posix.join(projDir, "tests", test.id);
    return test;
  }

  /**
   * Copy the export to the container's mounted directory to be tested.
   */
  public async mountModel(): Promise<string> {
    const model = await Export.findByPk(this.test.exportID);

    const FULL_TAR_PATH = path.posix.join(model.directory, model.tarfileName);
    if (!fs.existsSync(FULL_TAR_PATH)) return Promise.reject("model not found");

    const MOUNTED_MODEL_PATH = path.posix.join(this.project.directory, model.relativeDirPath, model.tarfileName);
    if (!fs.existsSync(MOUNTED_MODEL_PATH)) await fs.promises.copyFile(FULL_TAR_PATH, MOUNTED_MODEL_PATH);

    const CONTAINER_MODEL_PATH = path.posix.join(
      Docker.containerProjectPath(this.project),
      model.relativeDirPath,
      model.tarfileName
    );
    return Promise.resolve(CONTAINER_MODEL_PATH);
  }

  /**
   * Copy the video to the container's mounted directory to be used for the test.
   */
  public async mountVideo(): Promise<string> {
    const video = await Video.findByPk(this.test.videoID);
    if (!fs.existsSync(video.fullPath)) return Promise.reject("video not found");

    const MOUNTED_VIDEO_PATH = path.posix.join(this.project.directory, "videos", video.filename);
    if (!fs.existsSync(MOUNTED_VIDEO_PATH)) await fs.promises.copyFile(video.fullPath, MOUNTED_VIDEO_PATH);

    const CONTAINER_VIDEO_PATH = path.posix.join(Docker.containerProjectPath(this.project), "videos", video.filename);
    return Promise.resolve(CONTAINER_VIDEO_PATH);
  }

  /**
   * Create the testing parameter file to control the testing container.
   *
   * @param modelPath the path to the mounted export tarfile
   * @param videoPath the path to the mounted video to be used in the test
   */
  public async writeParameterFile(modelPath: string, videoPath: string): Promise<void> {
    const testparameters = {
      "test-video": videoPath,
      "model-tar": modelPath
    };
    const filepath = path.posix.join(this.project.directory, "testparameters.json");
    fs.writeFileSync(filepath, JSON.stringify(testparameters));
  }

  /**
   * Test the model. Requires the test parameter file, the export, and the video to be in the container's mounted directory.
   */
  public async testModel(): Promise<void> {
    this.container = await this.docker.createContainer(this.project, Tester.images.test, [this.streamPort]);
    await this.docker.runContainer(this.container);
  }

  /**
   * Save the output vid from the container to the path stored in the test object, with the desired name.
   */
  public async saveOutputVid(): Promise<void> {
    const CUSTOM_VID_PATH = path.posix.join(this.test.directory, `${this.test.name}.mp4`);
    const OUTPUT_VID_PATH = path.posix.join(this.project.directory, "inference.mp4");
    if (!fs.existsSync(OUTPUT_VID_PATH)) Promise.reject("cant find output video");
    await mkdirp(this.test.directory);
    await fs.promises.copyFile(OUTPUT_VID_PATH, CUSTOM_VID_PATH);
    this.test.fullPath = CUSTOM_VID_PATH;
    this.test.downloadPath = this.test.fullPath.split("/server/data/")[1]; //<- need to do this better
  }

  /**
   * Save the Test object in the Tester instance to the database.
   */
  public async saveTest(): Promise<void> {
    const exprt = await Export.findByPk(this.test.exportID);
    await this.test.save();
    await exprt.addTest(this.test);
  }

  public getJob(): Testjob {
    const testID = this.test ? this.test.id : "";
    return {
      testID: testID,
      exportID: this.test.exportID,
      projectID: this.project.id,
      streamPort: this.streamPort
    };
  }
}
