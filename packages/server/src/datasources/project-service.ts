import { DataSource } from "apollo-datasource";
import { Checkpoint, Export, ProjectStatus, ProjectUpdateInput } from "../schema/__generated__/graphql";
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
    await this.trainer.UpdateCheckpoints(id);
    return Object.values(this.trainer.projects[id].checkpoints);
  }
  async getExports(id: string): Promise<Export[]> {
    return Object.values(this.trainer.projects[id].exports);
  }
  async getStatus(id: string): Promise<ProjectStatus> {
    return this.trainer.projects[id].status;
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
    const project = await Project.create({ name });
    this.trainer.addProjectData(project);
    return project;
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

  async exportCheckpoint(id: string, checkpointNumber: number, name: string): Promise<Project> {
    this.trainer.export(id, checkpointNumber, name).catch((err) => console.log(err));
    const project = await Project.findByPk(id);
    console.log(`Started export on project: ${JSON.stringify(project)}`);
    return project;
  }

  async testModel(
    modelExport: Export,
    videoCustomName: string,
    filename: string,
    stream: fs.ReadStream
  ): Promise<Project> {
    const videoPath = await this.upload(filename, modelExport.projectId, stream);
    this.trainer.test(modelExport, videoPath, filename, videoCustomName).catch((err) => console.log(err));
    const project = await Project.findByPk(modelExport.projectId);
    console.log(`Started test: \nModel: ${modelExport} \nVideo: ${filename}`);
    return project;
  }

  private async upload(name: string, id: string, stream: fs.ReadStream): Promise<string> {
    const extractPath = `${this.path}/${id}/videos`; // <-- make this better
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
    return savePath;
  }
}
