import { DockerImage, Testjob } from "../schema/__generated__/graphql";
import { CONTAINER_MOUNT_PATH } from "./Docker";
import { Project, Export, Video, Test } from "../store";
import { Container } from "dockerode";
import * as mkdirp from "mkdirp";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";

export default class Tester {
  static readonly images: Record<string, DockerImage> = {
    test: { name: "gcperkins/wpilib-ml-test", tag: "latest" }
  };

  readonly project: Project;
  private container: Container;
  private streamPort: string;
  readonly docker: Docker;
  test: Test;

  constructor(project: Project, docker: Docker, port: string, name: string, exportID: string, videoID: string) {
    this.project = project;
    this.docker = docker;
    this.streamPort = port;
    this.test = this.createTest(name, exportID, videoID);
  }

  /**
   * Create test object to be stored by the Tester instance and then saved to the database.
   *
   * @param name The desired name of the test, and output video.
   * @param exportID the id of the export to be tested.
   * @param videoID the id of the video to be used for the test.
   */
  public createTest(name: string, exportID: string, videoID: string): Test {
    const test = Test.build({
      exportID: exportID,
      videoID: videoID,
      name: name
    });
    test.directory = path.posix.join(this.project.directory, "tests", test.id);
    return test;
  }

  /**
   * Copy the export to the container's mounted directory to be tested.
   */
  public async mountModel(): Promise<string> {
    const model = await Export.findByPk(this.test.exportID);

    const FULL_TAR_PATH = path.posix.join(model.directory, model.tarfileName);
    const MOUNTED_MODEL_PATH = path.posix.join(this.project.directory, model.relativeDirPath, model.tarfileName);
    const CONTAINER_MODEL_PATH = path.posix.join(CONTAINER_MOUNT_PATH, model.relativeDirPath, model.tarfileName);

    if (!fs.existsSync(FULL_TAR_PATH)) return Promise.reject("model not found");

    if (!fs.existsSync(MOUNTED_MODEL_PATH)) await fs.promises.copyFile(FULL_TAR_PATH, MOUNTED_MODEL_PATH);

    return Promise.resolve(CONTAINER_MODEL_PATH);
  }

  /**
   * Copy the video to the container's mounted directory to be used for the test.
   */
  public async mountVideo(): Promise<string> {
    const video = await Video.findByPk(this.test.videoID);

    const MOUNTED_VIDEO_PATH = path.posix.join(this.project.directory, "videos", video.filename);
    const CONTAINER_VIDEO_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "videos", video.filename);

    if (!fs.existsSync(video.fullPath)) {
      Promise.reject("video not found");
      return;
    }
    if (!fs.existsSync(MOUNTED_VIDEO_PATH)) await fs.promises.copyFile(video.fullPath, MOUNTED_VIDEO_PATH);

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
    fs.writeFileSync(path.posix.join(this.project.directory, "testparameters.json"), JSON.stringify(testparameters));
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
    const OUTPUT_VID_PATH = path.posix.join(this.project.directory, "inference.mp4");
    if (!fs.existsSync(OUTPUT_VID_PATH)) Promise.reject("cant find output video");

    await mkdirp(this.test.directory);
    const CUSTOM_VID_PATH = path.posix.join(this.test.directory, `${this.test.name}.mp4`);
    await fs.promises.copyFile(OUTPUT_VID_PATH, CUSTOM_VID_PATH);
  }

  /**
   * Save the Test object in the Tester instance to the database.
   */
  public async saveTest(): Promise<void> {
    const project = await Project.findByPk(this.project.id);
    await this.test.save();
    await project.addTest(this.test);
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

  public async print(): Promise<string> {
    return `Testjob: ${this.test.id}`;
  }
}
