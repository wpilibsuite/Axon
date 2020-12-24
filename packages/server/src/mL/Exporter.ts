import { DockerImage, Export } from "../schema/__generated__/graphql";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

export default class Exporter {
  static readonly images: Record<string, DockerImage> = {
    export: { name: "gcperkins/wpilib-ml-tflite", tag: "latest" }
  }

  readonly project: ProjectData;
  readonly docker: Docker;
  exp: Export;

  public constructor(project: ProjectData, docker: Docker){
    this.project = project;
    this.docker = docker;
  }

  public async locateCheckpoint(ckptNum: number): Promise<string> {
    const ckptPath = path.posix.join(this.project.directory, "train", `model.ckpt-${ckptNum}.meta`);
    if (fs.existsSync(ckptPath)) return Promise.resolve(ckptPath);
    else return Promise.reject("cannot find requested checkpoint");
  }

  public async createExport(id: string, name: string): Promise<void> {
    const TARFILE_NAME = `${name}.tar.gz`;
    const RELATIVE_DIR_PATH = path.posix.join("exports", name);
    const FULL_DIR_PATH = path.posix.join(project.directory, RELATIVE_DIR_PATH);
    const DOWNLOAD_PATH = path.posix.join(FULL_DIR_PATH, TARFILE_NAME).split("/server/data/")[1]; //<- need to do this better
    this.exp = {
      id: name, //<-- id should be the IDv4 when moved to sequelize
      name: name,
      projectId: id,
      directory: FULL_DIR_PATH,
      tarfileName: TARFILE_NAME,
      downloadPath: DOWNLOAD_PATH,
      relativeDirPath: RELATIVE_DIR_PATH
    };
  }

  public async createDestinationDirectory(exp: Export): Promise<void> {
    await mkdirp(path.posix.join(exp.directory, "checkpoint"));
  }

  public async moveCheckpointToMount(mount: string, checkpointNum: number, exportPath: string): Promise<void[]> {
    await mkdirp(path.posix.join(exportPath, "checkpoint"));
    async function copyCheckpointFile(extention: string): Promise<void> {
      return fs.promises.copyFile(
        path.posix.join("data", "checkpoints", `model.ckpt-${checkpointNum}`.concat(extention)),
        path.posix.join(mount, "checkpoints", `model.ckpt-${checkpointNum}`.concat(extention))
      );
    }
    return Promise.all([
      copyCheckpointFile(".data-00000-of-00001"),
      copyCheckpointFile(".index"),
      copyCheckpointFile(".meta")
    ]);
  }

  public async writeParameterFile(checkpointNumber: number): Promise<void> {
    const exportparameters = {
      name: this.exp.name,
      epochs: checkpointNumber,
      "export-dir": this.exp.relativeDirPath
    };
    fs.writeFileSync(path.posix.join(project.directory, "exportparameters.json"), JSON.stringify(exportparameters));
  }

  public async exportCheckpoint(): Promise<void> {
    const container: Container = await this.docker.createContainer(this.project, Exporter.images.export);
    await docker.runContainer(container);
  }

  public async saveExport(checkpointNumber: number): Promise<void> {
    this.project.exports[exp.id] = exp;
    project.checkpoints[checkpointNumber].status.downloadPaths.push(exp.downloadPath);
    await PseudoDatabase.pushProject(project);
  }

  public async updateCheckpointStatus(checkpointNum: number, isExporting: boolean): Promise<void> {
    this.project.checkpoints[checkpointNum].status.exporting = isExporting;
    await PseudoDatabase.pushProject(this.project);
  }
}
