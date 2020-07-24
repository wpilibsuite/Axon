import { DataSource } from "apollo-datasource";
import * as lowdb from "lowdb";
import * as FileAsync from "lowdb/adapters/FileAsync";
import { Hyperparameters, HyperparametersInput, Project } from "../schema/__generated__/graphql";
import * as shortid from "shortid";
import * as Lowdb from "lowdb";
import * as path from "path";
import Trainer from "../training";
import * as fs from "fs";

interface Database {
  projects: Project[];
}

async function createStore(storePath: string): Promise<{ low: lowdb.LowdbAsync<Database> }> {
  const dbFile = path.join(storePath, "db.json");
  const adapter = new FileAsync(dbFile);
  const low = await lowdb(adapter);

  await low
    .defaults({
      projects: []
    })
    .write();

  return { low };
}

export class ProjectService extends DataSource {
  private store: Promise<{ low: Lowdb.LowdbAsync<Database> }>;
  trainer: Trainer

  constructor(path: string, trainer: Trainer) {
    super();
    this.store = createStore(path);
    this.trainer = trainer
  }

  async getProjects(): Promise<Project[]> {
    return (await this.store).low.get("projects").value();
  }

  async getProject(id: string): Promise<Project> {
    let project = (await this.store).low.get("projects").find({ id }).value();

    project.checkpoints = []
    try {
      const data = fs.readFileSync(`mount/${id}/metrics.json`, "utf8");
      const metrics = JSON.parse(data);
      for (var step in metrics.precision) {
        project.checkpoints.push({
          step: parseInt(step, 10),
          metrics: { 
            precision: metrics.precision[step],
            loss: null,
            intersectionOverUnion: null
           }
        })
      }
      if (project.checkpoints.length > 0){
        console.log("current step: ", project.checkpoints[project.checkpoints.length - 1].step)
      }
    } catch (err) {
      console.log("could not read metrics", err);
    }

    return project;

  }

  async getProjectName(id: string): Promise<string> {
    return (await this.store).low.get("projects").find({ id }).value().name;
  }

  async updateHyperparameters(id: string, hyperparameters: HyperparametersInput): Promise<Project> {
    return (await this.store).low.get("projects").find({ id }).assign({ hyperparameters }).write();
  }
  
  async createProject(name: string): Promise<Project> {
    const project: Project = {
      id: shortid.generate(),
      name,
      inProgress: false,
      hyperparameters: {
        epochs: 10,
        batchSize: 8,
        evalFrequency: 1,
        percentEval: 0.8
      }
    };
    (await this.store).low.get("projects").push(project).write();
    return project;
  }
  
  async startTraining(id: string){
    let project = (await this.store).low.get("projects").find({ id }).value();
    this.trainer.start(id, project.hyperparameters);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project
  }

  async haltTraining(id: string){
    this.trainer.halt(id)
    let project = (await this.store).low.get("projects").find({ id }).value();
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }
  
}
