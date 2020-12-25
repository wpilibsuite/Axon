import { DockerImage, Test } from "../schema/__generated__/graphql";
import { ProjectData } from "../datasources/PseudoDatabase";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { CONTAINER_MOUNT_PATH } from "./Docker";
import { Container } from "dockerode";
import * as mkdirp from "mkdirp";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";

export default class Tester {
  static readonly images: Record<string, DockerImage> = {
    test: { name: "gcperkins/wpilib-ml-test", tag: "latest" }
  };

  readonly project: ProjectData;
  readonly docker: Docker;
  test: Test;

  constructor(project: ProjectData, docker: Docker) {
    this.project = project;
    this.docker = docker;
  }

  public async createTest(name: string, exportID: string, videoID: string): Promise<void> {
    const id = name; //will be the random idv4 when in sequalize
    const model = this.project.exports[exportID];
    const video = this.project.videos[videoID];
    const destinationDir = path.posix.join(this.project.directory, "tests", id);

    this.test = {
      id: id,
      name: name,
      model: model,
      video: video,
      directory: destinationDir
    };
  }

  public async mountModel(): Promise<string> {
    const FULL_TAR_PATH = path.posix.join(this.test.model.directory, this.test.model.tarfileName);
    const MOUNTED_MODEL_PATH = path.posix.join(
      this.project.directory,
      this.test.model.relativeDirPath,
      this.test.model.tarfileName
    );
    const CONTAINER_MODEL_PATH = path.posix.join(
      CONTAINER_MOUNT_PATH,
      this.test.model.relativeDirPath,
      this.test.model.tarfileName
    );

    if (!fs.existsSync(FULL_TAR_PATH)) return Promise.reject("model not found");

    if (!fs.existsSync(MOUNTED_MODEL_PATH)) await fs.promises.copyFile(FULL_TAR_PATH, MOUNTED_MODEL_PATH);

    return Promise.resolve(CONTAINER_MODEL_PATH);
  }

  public async mountVideo(): Promise<string> {
    const MOUNTED_VIDEO_PATH = path.posix.join(this.project.directory, "videos", this.test.video.filename);
    const CONTAINER_VIDEO_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "videos", this.test.video.filename);

    if (!fs.existsSync(this.test.video.fullPath)) {
      Promise.reject("video not found");
      return;
    }
    if (!fs.existsSync(MOUNTED_VIDEO_PATH)) await fs.promises.copyFile(this.test.video.fullPath, MOUNTED_VIDEO_PATH);

    return Promise.resolve(CONTAINER_VIDEO_PATH);
  }

  public async writeParameterFile(modelPath: string, videoPath: string): Promise<void> {
    const testparameters = {
      "test-video": videoPath,
      "model-tar": modelPath
    };
    fs.writeFileSync(path.posix.join(this.project.directory, "testparameters.json"), JSON.stringify(testparameters));
  }

  public async testModel(): Promise<void> {
    const container: Container = await this.docker.createContainer(this.project, Tester.images.test, ["5000"]);
    await this.docker.runContainer(container);
  }

  public async saveOutputVid(): Promise<void> {
    const OUTPUT_VID_PATH = path.posix.join(this.project.directory, "inference.mp4");
    if (!fs.existsSync(OUTPUT_VID_PATH)) Promise.reject("cant find output video");

    await mkdirp(this.test.directory);
    const CUSTOM_VID_PATH = path.posix.join(this.test.directory, `${this.test.name}.mp4`);
    await fs.promises.copyFile(OUTPUT_VID_PATH, CUSTOM_VID_PATH);
  }

  public async saveTest(): Promise<void> {
    this.project.tests[this.test.id] = this.test;
    PseudoDatabase.pushProject(this.project);
  }
}
