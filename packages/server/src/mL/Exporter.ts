import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import { Project } from "../store";
import { Container } from "dockerode";
import * as Dockerode from "dockerode";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

import { CONTAINER_MOUNT_PATH } from "./index";

export default class Exporter {
  static readonly docker = new Dockerode();

  public static async runContainer(containerID: string): Promise<void> {
    const container: Container = await Exporter.docker.getContainer(containerID);
    await container.start();
    await container.wait();
    await container.remove();
    Promise.resolve();
  }

  public static async moveCheckpointToMount(mount: string, checkpointNum: number, exportPath: string): Promise<void> {
    await mkdirp(path.posix.join(exportPath, "checkpoint"));
    async function copyCheckpointFile(extention: string): Promise<void> {
      return fs.promises.copyFile(
        path.posix.join("data", "checkpoints", `model.ckpt-${checkpointNum}`.concat(extention)),
        path.posix.join(mount, "checkpoints", `model.ckpt-${checkpointNum}`.concat(extention))
      );
    }
    await Promise.all([
      copyCheckpointFile(".data-00000-of-00001"),
      copyCheckpointFile(".index"),
      copyCheckpointFile(".meta")
    ]);

    Promise.resolve();
    return;
  }

  public static async writeParameterFile(name, checkpointNumber, mount: string): Promise<void> {
    const exportparameters = {
      name: name,
      epochs: checkpointNumber,
      "export-dir": `exports/${name}`
    };
    fs.writeFileSync(path.posix.join(mount, "exportparameters.json"), JSON.stringify(exportparameters));
  }

  public static async updateCheckpointStatus(id: string, checkpointNum: number, isExporting: boolean): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    project.checkpoints[checkpointNum].status.exporting = isExporting;
    Promise.resolve();
    return;
  }

  public static async addExportPath(id: string, checkpointNum: number, exportPath: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    project.checkpoints[checkpointNum].status.exportPaths.push(exportPath);
    Promise.resolve();
    return;
  }
}
