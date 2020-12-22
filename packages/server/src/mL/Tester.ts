import { Test } from "../schema/__generated__/graphql";
import { ProjectData } from "../datasources/PseudoDatabase";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { CONTAINER_MOUNT_PATH } from "./Docker";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";

export default class Tester {
  static async createTest(name: string, projectID: string, exportID: string, videoID: string): Promise<Test> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(projectID);

    const id = name; //will be the random idv4 when in sequalize
    const model = project.exports[exportID];
    const video = project.videos[videoID];
    const destinationDir = path.posix.join(project.directory, "tests", id);

    return {
      id: id,
      name: name,
      model: model,
      video: video,
      directory: destinationDir
    };
  }

  static async mountModel(test: Test, mount: string): Promise<string> {
    const FULL_TAR_PATH = path.posix.join(test.model.directory, test.model.tarfileName);
    const MOUNTED_MODEL_PATH = path.posix.join(mount, test.model.relativeDirPath, test.model.tarfileName);
    const CONTAINER_MODEL_PATH = path.posix.join(
      CONTAINER_MOUNT_PATH,
      test.model.relativeDirPath,
      test.model.tarfileName
    );

    if (!fs.existsSync(FULL_TAR_PATH)) return Promise.reject("model not found");

    if (!fs.existsSync(MOUNTED_MODEL_PATH)) await fs.promises.copyFile(FULL_TAR_PATH, MOUNTED_MODEL_PATH);

    return Promise.resolve(CONTAINER_MODEL_PATH);
  }

  static async mountVideo(test: Test, mount: string): Promise<string> {
    const MOUNTED_VIDEO_PATH = path.posix.join(mount, "videos", test.video.filename);
    const CONTAINER_VIDEO_PATH = path.posix.join(CONTAINER_MOUNT_PATH, "videos", test.video.filename);

    if (!fs.existsSync(test.video.fullPath)) {
      Promise.reject("video not found");
      return;
    }
    if (!fs.existsSync(MOUNTED_VIDEO_PATH)) await fs.promises.copyFile(test.video.fullPath, MOUNTED_VIDEO_PATH);

    return Promise.resolve(CONTAINER_VIDEO_PATH);
  }

  static async writeParameterFile(mount: string, modelPath: string, videoPath: string): Promise<void> {
    const testparameters = {
      "test-video": videoPath,
      "model-tar": modelPath
    };
    fs.writeFileSync(path.posix.join(mount, "testparameters.json"), JSON.stringify(testparameters));
  }

  static async saveOutputVid(test: Test, mount: string): Promise<void> {
    const OUTPUT_VID_PATH = path.posix.join(mount, "inference.mp4");
    if (!fs.existsSync(OUTPUT_VID_PATH)) Promise.reject("cant find output video");

    const CUSTOM_VID_DIR = path.posix.join(mount, "tests", test.id);
    const CUSTOM_VID_PATH = path.posix.join(CUSTOM_VID_DIR, `${test.name}.mp4`);
    await mkdirp(CUSTOM_VID_DIR);
    await fs.promises.copyFile(OUTPUT_VID_PATH, CUSTOM_VID_PATH);
  }
}
