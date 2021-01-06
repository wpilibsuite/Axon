import { DockerImage, Exportjob } from "../schema/__generated__/graphql";
import { Project, Checkpoint, Export } from "../store";
import { Container } from "dockerode";
import * as mkdirp from "mkdirp";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";

export default class Exporter {
  static readonly images: Record<string, DockerImage> = {
    export: { name: "gcperkins/wpilib-ml-tflite", tag: "latest" }
  };

  readonly project: Project;
  readonly docker: Docker;
  ckptID: string;
  exp: Export;

  public constructor(project: Project, docker: Docker, ckptID: string, exptName: string) {
    this.project = project;
    this.docker = docker;
    this.ckptID = ckptID;
    this.exp = this.createExport(exptName);
  }

  /**
   * Create the Export object to be stored in the Exporter instance.
   *
   * @param name The desired name of the exported tarfile.
   */
  private createExport(name: string): Export {
    const exp = Export.build({
      name: name,
      projectID: this.project.id,
      checkpointID: this.ckptID,
      tarfileName: `${name}.tar.gz`
    });
    exp.relativeDirPath = path.posix.join("exports", exp.id);
    exp.directory = path.posix.join(this.project.directory, exp.relativeDirPath);
    exp.downloadPath = path.posix.join(exp.directory, exp.tarfileName).split("/server/data/")[1]; //<- need to do this better
    return exp;
  }

  /**
   * Verify that a checkpoint exists.
   *
   * @param path The full path to the checkpoint, without the file extensions.
   */
  public static async checkpointExists(path: string): Promise<boolean> {
    async function checkpointFileExists(extention: string) {
      return new Promise((resolve) => fs.exists(path.concat(extention), resolve));
    }
    return (
      await Promise.all([
        checkpointFileExists(".data-00000-of-00001"),
        checkpointFileExists(".index"),
        checkpointFileExists(".meta")
      ])
    ).every(Boolean);
  }

  /**
   * Create the direcory to hold the export and its checkpoint.
   * Uses the Export previously saved in the Exporter instance for the necessary information.
   */
  public async createDestinationDirectory(): Promise<void> {
    await mkdirp(path.posix.join(this.exp.directory, "checkpoint"));
  }

  /**
   * Create parameter file in the mounted directory to control the export container.
   */
  public async writeParameterFile(): Promise<void> {
    //pipeline.config must be in project dir
    const container_project_path = Docker.containerProjectPath(this.project);
    const config_path = path.posix.join(container_project_path, "pipeline.config");
    //checkpoint path from containers perspective
    const checkpoint = await Checkpoint.findByPk(this.ckptID);
    const checkpoint_relative_path = checkpoint.path.replace(this.project.directory, "");
    const checkpoint_path = path.posix.join(container_project_path, checkpoint_relative_path);

    const exportparameters = {
      name: this.exp.name,
      config: config_path,
      checkpoint: checkpoint_path,
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
   */
  public async saveExport(): Promise<void> {
    const project = await Project.findByPk(this.project.id);
    await this.exp.save();
    await project.addExport(this.exp);
  }

  public getJob(): Exportjob {
    return {
      name: this.exp.name,
      projectID: this.project.id,
      checkpointID: this.ckptID,
      exportID: this.exp.id
    };
  }
}
