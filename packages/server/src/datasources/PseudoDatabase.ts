import { Test, Video } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Dataset } from "../store";
import { DATA_DIR } from "../constants";
import { PROJECT_DATA_DIR } from "../constants";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";

export type ProjectData = {
  id: string;
  name: string;
  initialCheckpoint: string;
  datasets: Dataset[];
  directory: string;
  hyperparameters: {
    epochs: number;
    batchSize: number;
    evalFrequency: number;
    percentEval: number;
  };
  videos: { [id: string]: Video };
  tests: { [id: string]: Test };
  containerIDs: {
    tflite: string;
    train: string;
    metrics: string;
    export: string;
    test: string;
  };
};

type ProjectDatabase = { [id: string]: ProjectData };

export default class PseudoDatabase {
  static dataPath = `${DATA_DIR}/psuedoDatabase.json`;

  public static async addProjectData(project: Project): Promise<void> {
    const duplicateProject = await PseudoDatabase.retrieveProject(project.id);
    if (duplicateProject) throw "Attempted to add an existing project to pseudo database!";

    const DATASETS: Dataset[] = await project.getDatasets();

    const MOUNT = `/${PROJECT_DATA_DIR}/${project.id}`.replace(/\\/g, "/");
    await mkdirp(MOUNT);
    await fs.promises.mkdir(path.posix.join(MOUNT, "dataset"));
    await fs.promises.mkdir(path.posix.join(MOUNT, "exports"));

    const newProjectData = {
      id: project.id,
      name: project.name,
      initialCheckpoint: project.initialCheckpoint,
      datasets: DATASETS,
      directory: MOUNT,
      hyperparameters: {
        epochs: project.epochs,
        batchSize: project.batchSize,
        evalFrequency: project.evalFrequency,
        percentEval: project.percentEval
      },
      videos: {},
      tests: {},
      containerIDs: {
        tflite: null,
        train: null,
        metrics: null,
        export: null,
        test: null
      }
    };

    await PseudoDatabase.pushProject(newProjectData);

    Promise.resolve();
  }

  public static async retrieveDatabase(): Promise<ProjectDatabase> {
    if (!fs.existsSync(this.dataPath)) await fs.promises.writeFile(this.dataPath, JSON.stringify({}));

    const jsonRead = await fs.promises.readFile(this.dataPath, "utf8");
    const data = JSON.parse(jsonRead);

    return data;
  }

  public static async retrieveProject(id: string): Promise<ProjectData> {
    const database = await PseudoDatabase.retrieveDatabase();

    if (id in database) return database[id];
    else return null;
  }

  public static async pushProject(project: ProjectData): Promise<void> {
    const database = await PseudoDatabase.retrieveDatabase();

    database[project.id] = project;
    await fs.promises.writeFile(this.dataPath, JSON.stringify(database, null, 4));
    Promise.resolve();
  }
}
