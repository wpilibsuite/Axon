import { DockerImage, Export, Exportjob } from "../schema/__generated__/graphql";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import { Container } from "dockerode";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

export default class Exporter {
  static readonly images: Record<string, DockerImage> = {
    export: { name: "gcperkins/wpilib-ml-tflite", tag: "latest" }
  };

  readonly project: ProjectData;
  readonly docker: Docker;
  ckptID: string;
  exp: Export;

  public constructor(project: ProjectData, docker: Docker, ckptNum: number, exptName: string) {
    this.ckptID = ckptNum.toString();
    this.project = project;
    this.docker = docker;
    this.exp = this.createExport(exptName);
  }

  /**
   * Reject if the checkpoint does not exist where it should.
   *
   * @param ckptNum The epoch of the checkpoint to be exported
   */
  public async locateCheckpoint(): Promise<void> {
    const ckptPath = path.posix.join(this.project.directory, "train", `model.ckpt-${this.ckptID}.meta`);
    if (!fs.existsSync(ckptPath)) return Promise.reject("cannot find requested checkpoint");
  }

  /**
   * Create the Export object to be stored in the Exporter instance.
   *
   * @param name The desired name of the exported tarfile.
   */
  public createExport(name: string): Export {
    const TARFILE_NAME = `${name}.tar.gz`;
    const RELATIVE_DIR_PATH = path.posix.join("exports", name);
    const FULL_DIR_PATH = path.posix.join(this.project.directory, RELATIVE_DIR_PATH);
    const DOWNLOAD_PATH = path.posix.join(FULL_DIR_PATH, TARFILE_NAME).split("/server/data/")[1]; //<- need to do this better
    return {
      id: name, //<-- id should be the IDv4 when moved to sequelize
      name: name,
      projectId: this.project.id,
      directory: FULL_DIR_PATH,
      tarfileName: TARFILE_NAME,
      downloadPath: DOWNLOAD_PATH,
      relativeDirPath: RELATIVE_DIR_PATH
    };
  }

  /**
   * Create the direcory to hold the export and its checkpoint.
   * Uses the Export previously saved in the Exporter instance for the necessary information.
   */
  public async createDestinationDirectory(): Promise<void> {
    await mkdirp(path.posix.join(this.exp.directory, "checkpoint"));
  }

  /**
   * Move the checkpoint to the container's mount.
   * Only needed if the checkpoint exists outside the mount, which is not the case yet.
   *
   * @param mount The path to the mounted directory of the export container
   * @param checkpointNum The epoch of the exported checkpoint
   */
  public async moveCheckpointToMount(mount: string, checkpointNum: number): Promise<void[]> {
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

  /**
   * Create parameter file in the mounted directory to control the export container.
   *
   * @param checkpointNumber The epoch of the exported checkpoint
   */
  public async writeParameterFile(): Promise<void> {
    const exportparameters = {
      name: this.exp.name,
      epochs: this.ckptID,
      "export-dir": this.exp.relativeDirPath
    };
    fs.writeFileSync(
      path.posix.join(this.project.directory, "exportparameters.json"),
      JSON.stringify(exportparameters)
    );
  }

  /**
   * Run the export container.
   */
  public async exportCheckpoint(): Promise<void> {
    const container: Container = await this.docker.createContainer(this.project, Exporter.images.export);
    await this.docker.runContainer(container);
  }

  /**
   * Save the previously stored Export object to the database.
   *
   * @param checkpointNumber The epoch of the exported checkpoint
   */
  public async saveExport(): Promise<void> {
    this.project.exports[this.exp.id] = this.exp;
    this.project.checkpoints[this.ckptID].status.downloadPaths.push(this.exp.downloadPath);
    await PseudoDatabase.pushProject(this.project);
  }

  /**
   * Update the checkpoints status (exporting/not exporting) in the database.
   *
   * @param checkpointNumber The epoch of the exported checkpoint
   * @param isExporting True if the checkpoint is currently being executed
   */
  public async updateCheckpointStatus(isExporting: boolean): Promise<void> {
    this.project.checkpoints[this.ckptID].status.exporting = isExporting;
    await PseudoDatabase.pushProject(this.project);
  }

  public getJob(): Exportjob {
    return {
      projectID: this.project.id,
      checkpointID: this.ckptID,
      exportID: this.exp.id
    };
  }

  public async print(): Promise<string> {
    return `Exportjob: ${this.exp.id}`;
  }
}
