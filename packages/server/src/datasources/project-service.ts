import { DataSource } from "apollo-datasource";
import { Hyperparameters, HyperparametersInput } from "../schema/__generated__/graphql";
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
}
