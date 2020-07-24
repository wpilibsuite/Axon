import { DataSource } from "apollo-datasource";
import { Hyperparameters, HyperparametersInput } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Sequelize } from "sequelize";
import Trainer from "../training";
import * as fs from "fs";


export class ProjectService extends DataSource {
  private store: Sequelize;
  trainer: Trainer;

  constructor(store: Sequelize, trainer: Trainer) {
    super();
    this.store = store;
    this.trainer = trainer;
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    
    const project = Project.findByPk(id);

    project.checkpoints = [];
    try {
      const data = fs.readFileSync(`mount/${id}/metrics.json`, "utf8");
      const metrics = JSON.parse(data);
      for (const step in metrics.precision) {
        project.checkpoints.push({
          step: parseInt(step, 10),
          metrics: {
            precision: metrics.precision[step],
            loss: null,
            intersectionOverUnion: null
          }
        });
      }
      if (project.checkpoints.length > 0) {
        console.log("current step: ", project.checkpoints[project.checkpoints.length - 1].step);
      }
    } catch (err) {
      console.log("could not read metrics", err);
    }

    return project
  }

  async getHyperparameters(id: string): Promise<Hyperparameters> {
    const project = await Project.findByPk(id);
    return {
      batchSize: project.batchSize,
      epochs: project.epochs,
      evalFrequency: project.evalFrequency,
      percentEval: project.percentEval
    };
  }

  async updateHyperparameters(id: string, hyperparameters: HyperparametersInput): Promise<Project> {
    const project = await Project.findByPk(id);
    project.batchSize = hyperparameters.batchSize;
    project.epochs = hyperparameters.epochs;
    project.evalFrequency = hyperparameters.evalFrequency;
    project.percentEval = hyperparameters.percentEval;
    return await project.save();
  }

  async createProject(name: string): Promise<Project> {
    return await Project.create({ name });
  }

  async startTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    this.trainer.start(id, project.hyperparameters);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async haltTraining(id: string): Promise<Project> {
    this.trainer.halt(id);
    const project = await Project.findByPk(id);
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }
}
