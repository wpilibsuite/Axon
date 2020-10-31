import { Container } from "dockerode";
import { Checkpoint, Export,  } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { DATA_DIR } from "../constants";
import { PROJECT_DATA_DIR } from "../constants";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";

type ProjectData = {
  id: string;
  name: string;
  initialCheckpoint: string;
  directory: string;
  hyperparams: {
    epochs: number;
    batchSize: number;
    evalFrequency: number;
    percentEval: number;
  };
  checkpoints: { [step: string]: Checkpoint };
  exports: { [id: string]: Export };
  containers: {
    tflite: Container;
    train: Container;
    metrics: Container;
    export: Container;
    test: Container;
  };
};

type ProjectDatabase = { [id: string]: ProjectData };

export default class PseudoDatabase {
  static dataPath = `${DATA_DIR}/psuedoDatabase.json`;

  public static async addProjectData(project: Project): Promise<void> {
    const duplicateProject = await PseudoDatabase.retrieveProject(project.id);

    console.log(duplicateProject);
    if (duplicateProject) throw "Attempted to add an existing project to pseudo database!";

    const MOUNT = `${PROJECT_DATA_DIR}/${project.id}`.replace(/\\/g, "/");
    //await mkdirp(MOUNT)
    //await fs.promises.mkdir(path.posix.join(MOUNT, "dataset"))
    //await fs.promises.mkdir(path.posix.join(MOUNT, "exports"))

    const newProjectData = {
      id: project.id,
      name: project.name,
      initialCheckpoint: project.initialCheckpoint,
      directory: MOUNT,
      hyperparams: {
        epochs: project.epochs,
        batchSize: project.batchSize,
        evalFrequency: project.evalFrequency,
        percentEval: project.percentEval
      },
      checkpoints: {},
      exports: {},
      containers: {
        tflite: null,
        train: null,
        metrics: null,
        export: null,
        test: null
      }
    };

    await PseudoDatabase.pushProject(newProjectData);
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
  }
}