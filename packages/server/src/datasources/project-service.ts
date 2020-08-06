import { DataSource } from "apollo-datasource";
import { Checkpoint, ProjectUpdateInput } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Sequelize } from "sequelize";
import Trainer from "../training";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";


export class ProjectService extends DataSource {
  private store: Sequelize;
  private trainer: Trainer;
  private readonly path: string;

  constructor(store: Sequelize, trainer: Trainer, path: string) {
    super();
    this.store = store;
    this.trainer = trainer;
    this.path = path;
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    return Project.findByPk(id);
  }

  async getCheckpoints(id: string): Promise<Checkpoint[]> {
    return this.trainer.getProjectCheckpoints(id);
  }

  async updateProject(id: string, updates: ProjectUpdateInput): Promise<Project> {
    const project = await Project.findByPk(id);
    if (updates.name !== undefined) {
      project.name = updates.name;
    }
    if (updates.datasets !== undefined) {
      await project.setDatasets(updates.datasets);
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
    return await project.save();
  }

  async setDatasetInProject(projectId: string, datasetId: string, isIncluded: boolean): Promise<Project> {
    const project = await Project.findByPk(projectId);
    if (isIncluded) {
      await project.addDataset(datasetId);
    } else {
      await project.removeDataset(datasetId);
    }
    return project;
  }

  async createProject(name: string): Promise<Project> {
    return await Project.create({ name });
  }

  async startTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    this.trainer.start(project);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async haltTraining(id: string): Promise<Project> {
    this.trainer.halt(id);
    const project = await Project.findByPk(id);
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async exportCheckpoint(id: string, checkpointNumber: number, name: string, test: boolean, filename: string = null, stream: fs.ReadStream = null): Promise<Project> {

    if (test) {
      await this.upload(filename, id, stream);
    }
    
    this.trainer.export(id, checkpointNumber, name, test, filename).catch((err) => console.log(err));
    const project = await Project.findByPk(id);
    console.log(`Started export on project: ${JSON.stringify(project)}`);
    return project;
  }
  
  private async upload(name: string, id: string, stream: fs.ReadStream) {
    const extractPath = `${this.path}/${id}/mount/videos`;
    const savePath = path.join(extractPath, name);
    await mkdirp(extractPath);
    
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(savePath);
      writeStream.on("finish", resolve);
      writeStream.on("error", (error) => {
        unlink(extractPath, () => {
          reject(error);
        });
      });
      stream.on("error", (error) => writeStream.destroy(error));
      stream.pipe(writeStream);
    });
  }
  
}