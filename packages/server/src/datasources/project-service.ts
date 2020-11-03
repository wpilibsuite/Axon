import { DataSource } from "apollo-datasource";
import { Checkpoint, Export, ProjectStatus, ProjectUpdateInput } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Sequelize } from "sequelize";
import MLService from "../training";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";
import PseudoDatabase from "./PseudoDatabase";

export class ProjectService extends DataSource {
  private store: Sequelize;
  private mLService: MLService;
  private readonly path: string;

  constructor(store: Sequelize, mLService: MLService, path: string) {
    super();
    this.store = store;
    this.mLService = mLService;
    this.path = path;
  }

  async getTrainerState(): Promise<number> {
    return this.mLService.trainer_state;
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    return Project.findByPk(id);
  }

  async getCheckpoints(id: string): Promise<Checkpoint[]> {
    await this.mLService.UpdateCheckpoints(id);
    return Object.values(this.mLService.projects[id].checkpoints);
  }
  async getExports(id: string): Promise<Export[]> {
    return Object.values(this.mLService.projects[id].exports);
  }
  async getStatus(id: string): Promise<ProjectStatus> {
    return this.mLService.projects[id].status;
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
    // this.trainer.addProjectData(project);

    PseudoDatabase.addProjectData(project);

    return project;
  }

  async startTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    this.mLService.start(project);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async haltTraining(id: string): Promise<Project> {
    this.mLService.halt(id);
    const project = await Project.findByPk(id);
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async pauseTraining(id: string): Promise<Project> {
    this.mLService.toggleContainer(id, true);
    const project = await Project.findByPk(id);
    console.log(`PAUSED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async resumeTraining(id: string): Promise<Project> {
    this.mLService.toggleContainer(id, false);
    const project = await Project.findByPk(id);
    console.log(`RESUMED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async exportCheckpoint(id: string, checkpointNumber: number, name: string): Promise<Project> {
    this.mLService.export(id, checkpointNumber, name).catch((err) => console.log(err));
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
    this.mLService.test(modelExport, videoPath, filename, videoCustomName).catch((err) => console.log(err));
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

  async databaseTest(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    console.log(project);
    return project;
  }
}
