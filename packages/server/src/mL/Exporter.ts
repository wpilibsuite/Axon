import { Export } from "../schema/__generated__/graphql";
import PseudoDatabase from "../datasources/PseudoDatabase";
import { ProjectData } from "../datasources/PseudoDatabase";
import { EXPORT_IMAGE } from "./index";
import Docker from "./Docker";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

export default class Exporter {
  public static async locateCheckpoint(id: string, ckptNum: number): Promise<string> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    const ckptPath = path.posix.join(project.directory, "train", `model.ckpt-${ckptNum}.meta`);
    if (fs.existsSync(ckptPath)) return Promise.resolve(ckptPath);
    else return Promise.reject("cannot find requested checkpoint");
  }

  public static async createExport(id: string, name: string): Promise<Export> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    const EXPORT_DIR = path.posix.join(project.directory, "exports", name);
    const TAR_PATH = path.posix.join(EXPORT_DIR, `${name}.tar.gz`);
    const DOWNLOAD_PATH = TAR_PATH.split("/server/data/")[1];

    const exp: Export = {
      id: name, //<-- id should be the IDv4 when moved to sequelize
      name: name,
      projectId: id,
      tarPath: TAR_PATH,
      directory: EXPORT_DIR,
      downloadPath: DOWNLOAD_PATH
    };

    return Promise.resolve(exp);
  }

  public static async createDestinationDirectory(exp: Export): Promise<void> {
    await mkdirp(path.posix.join(exp.directory, "checkpoint"));
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

  public static async writeParameterFile(id: string, name: string, checkpointNumber: number): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    const exportparameters = {
      name: name,
      epochs: checkpointNumber,
      "export-dir": `exports/${name}`
    };
    fs.writeFileSync(path.posix.join(project.directory, "exportparameters.json"), JSON.stringify(exportparameters));
  }

  public static async exportCheckpoint(id: string): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    project.containerIDs.export = await Docker.createContainer(EXPORT_IMAGE, "EXPORT-", id, project.directory);
    await Docker.runContainer(project.containerIDs.export);
    project.containerIDs.export = null;
  }

  public static async saveExport(id: string, exp: Export, checkpointNumber: number): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    project.exports[exp.id] = exp;
    project.checkpoints[checkpointNumber].status.downloadPaths.push(exp.downloadPath);
    await PseudoDatabase.pushProject(project);
  }

  public static async updateCheckpointStatus(id: string, checkpointNum: number, isExporting: boolean): Promise<void> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);
    project.checkpoints[checkpointNum].status.exporting = isExporting;
    Promise.resolve();
    return;
  }
}
