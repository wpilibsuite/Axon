import { DataSource } from "apollo-datasource";
import { ProjectUpdateInput } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Sequelize } from "sequelize";

export class ProjectService extends DataSource {
  private store: Sequelize;

  constructor(store: Sequelize) {
    super();
    this.store = store;
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    return Project.findByPk(id);
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
    return await project.save();
  }

  async createProject(name: string): Promise<Project> {
    return await Project.create({ name });
  }

  async startTraining(id: string): Promise<Project> {
    const project = (await this.store).low.get("projects").find({ id }).value();
    this.trainer.start(id, project.hyperparameters);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async haltTraining(id: string): Promise<Project> {
    this.trainer.halt(id);
    const project = (await this.store).low.get("projects").find({ id }).value();
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }
}
