import { DataSource } from "apollo-datasource";
import { Checkpoint, ProjectUpdateInput } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Sequelize } from "sequelize";
import Trainer from "../training";

export class ProjectService extends DataSource {
  private store: Sequelize;
  private trainer: Trainer;

  constructor(store: Sequelize, trainer: Trainer) {
    super();
    this.store = store;
    this.trainer = trainer;
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    if (project) {
      project.checkpoints = await this.trainer.getProjectCheckpoints(id);
    }
    return project;
  }

  async getCheckpoints(id: string): Promise<Checkpoint[]> {
    return this.trainer.getProjectCheckpoints(id);
  }

  async updateProject(id: string, updates: ProjectUpdateInput): Promise<Project> {
    const project = await Project.findByPk(id);
    if (updates.name !== undefined) {
      project.name = updates.name;
    }
    if (updates.epochs !== undefined) {
      project.epochs = updates.epochs;
    }
    if (updates.batchSize !== undefined) {
      project.batchSize = updates.batchSize;
    }
    if (updates.evalFrequency !== undefined) {
      project.evalFrequency = updates.evalFrequency;
    }
    if (updates.percentEval !== undefined) {
      project.percentEval = updates.percentEval;
    }
    if (updates.initialCheckpoint !== undefined) {
      project.initialCheckpoint = updates.initialCheckpoint;
    }
    if (updates.datasetPath !== undefined) {
      project.datasetPath = updates.datasetPath;
    }
    return await project.save();
  }

  async createProject(name: string): Promise<Project> {
    return await Project.create({ name });
  }

  async startTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    const hyperparameters = {
      name: project.name,
      epochs: project.epochs,
      batchSize: project.batchSize,
      evalFrequency: project.evalFrequency,
      percentEval: project.percentEval,
      datasetPath: project.datasetPath,
      checkpoint: project.initialCheckpoint
    };
    this.trainer.start(id, hyperparameters).catch((err) => console.log(err));
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async haltTraining(id: string): Promise<Project> {
    this.trainer.halt(id);
    const project = await Project.findByPk(id);
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async exportCheckpoint(id: string, checkpointNumber: number, name: string): Promise<Project> {
    this.trainer.export(id, checkpointNumber, name).catch((err) => console.log(err));
    const project = await Project.findByPk(id);
    console.log(`Started export on project: ${JSON.stringify(project)}`);
    return project;
  }
}
