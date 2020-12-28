import { DataSource } from "apollo-datasource";
import {
  Checkpoint,
  Export,
  Video,
  ProjectUpdateInput,
  Trainjob,
  Testjob,
  Exportjob,
  DockerState
} from "../schema/__generated__/graphql";
import { Project } from "../store";
import { Sequelize } from "sequelize";
import MLService from "../mL";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";
import PseudoDatabase from "./PseudoDatabase";
import { ProjectData } from "./PseudoDatabase";

export class ProjectService extends DataSource {
  private readonly store: Sequelize;
  private readonly mLService: MLService;
  private readonly path: string;

  constructor(store: Sequelize, mLService: MLService, path: string) {
    super();
    this.store = store;
    this.mLService = mLService;
    this.path = path;
  }

  async getDockerState(): Promise<DockerState> {
    return this.mLService.getDockerState();
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    return Project.findByPk(id);
  }

  async getCheckpoints(id: string): Promise<Checkpoint[]> {
    await this.mLService.updateCheckpoints(id);
    const project = await PseudoDatabase.retrieveProject(id);
    return Object.values(project.checkpoints);
  }
  async getExports(id: string): Promise<Export[]> {
    const project = await PseudoDatabase.retrieveProject(id);
    return Object.values(project.exports);
  }
  async getVideos(id: string): Promise<Video[]> {
    const project = await PseudoDatabase.retrieveProject(id);
    return Object.values(project.videos);
  }

  async updateProject(id: string, updates: ProjectUpdateInput): Promise<Project> {
    const project = await Project.findByPk(id);

    const pDBproject = await PseudoDatabase.retrieveProject(id);

    if (updates.name !== undefined) {
      project.name = updates.name;
      pDBproject.name = updates.name;
    }
    if (updates.datasets !== undefined) {
      await project.setDatasets(updates.datasets);
    }
    if (updates.epochs !== undefined) {
      project.epochs = updates.epochs;
      pDBproject.hyperparameters.epochs = updates.epochs;
    }
    if (updates.batchSize !== undefined) {
      project.batchSize = updates.batchSize;
      pDBproject.hyperparameters.batchSize = updates.batchSize;
    }
    if (updates.evalFrequency !== undefined) {
      project.evalFrequency = updates.evalFrequency;
      pDBproject.hyperparameters.evalFrequency = updates.evalFrequency;
    }
    if (updates.percentEval !== undefined) {
      project.percentEval = updates.percentEval;
      pDBproject.hyperparameters.percentEval = updates.percentEval;
    }
    if (updates.initialCheckpoint !== undefined) {
      project.initialCheckpoint = updates.initialCheckpoint;
      pDBproject.initialCheckpoint = updates.initialCheckpoint;
    }

    PseudoDatabase.pushProject(pDBproject);

    return await project.save();
  }

  async setDatasetInProject(projectId: string, datasetId: string, isIncluded: boolean): Promise<Project> {
    const project = await Project.findByPk(projectId);
    if (isIncluded) {
      await project.addDataset(datasetId);
    } else {
      await project.removeDataset(datasetId);
    }
    const pDBproject = await PseudoDatabase.retrieveProject(projectId);
    pDBproject.datasets = await project.getDatasets();
    PseudoDatabase.pushProject(pDBproject);
    return project;
  }

  async createProject(name: string): Promise<Project> {
    const project = await Project.create({ name });
    await PseudoDatabase.addProjectData(project);
    return project;
  }

  async getTrainjobs(): Promise<Trainjob[]> {
    return this.mLService.getTrainjobs();
  }

  async getExportjobs(): Promise<Exportjob[]> {
    return this.mLService.getExportjobs();
  }

  async getTestjobs(): Promise<Testjob[]> {
    return this.mLService.getTestjobs();
  }

  async startTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    this.mLService.start(project);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async haltTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    console.log(`stopping training on project: ${JSON.stringify(project)}`);
    this.mLService.halt(id);
    return project;
  }

  async pauseTraining(id: string): Promise<Project> {
    this.mLService.pauseTraining(id);
    const project = await Project.findByPk(id);
    console.log(`pausing training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async resumeTraining(id: string): Promise<Project> {
    this.mLService.resumeTraining(id);
    const project = await Project.findByPk(id);
    console.log(`resuming training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async exportCheckpoint(id: string, checkpointNumber: number, name: string): Promise<Project> {
    this.mLService.export(id, checkpointNumber, name).catch((err) => console.log(err));
    const project = await Project.findByPk(id);
    console.log(`Started export on project: ${JSON.stringify(project)}`);
    return project;
  }

  async testModel(testName: string, projectId: string, exportId: string, videoId: string): Promise<Project> {
    const project = await Project.findByPk(projectId);
    console.log(`Started test: \nModel: ${exportId} \nVideo: ${videoId}`);
    this.mLService.test(testName, projectId, exportId, videoId).catch((err) => console.log(err));
    return project;
  }

  async saveVideo(id: string, videoName: string, filename: string, stream: fs.ReadStream): Promise<Video> {
    const project: ProjectData = await PseudoDatabase.retrieveProject(id);

    const videoId: string = videoName; // <-- fix
    const videoDir: string = path.posix.join(project.directory, "videos", videoId);
    const videoPath: string = path.posix.join(videoDir, filename);
    await mkdirp(videoDir);

    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(videoPath);
      writeStream.on("finish", resolve);
      writeStream.on("error", (error) => {
        unlink(videoDir, () => {
          reject(error);
        });
      });
      stream.on("error", (error) => writeStream.destroy(error));
      stream.pipe(writeStream);
    });

    const video: Video = {
      id: videoName,
      name: videoName,
      filename: filename,
      fullPath: videoPath
    };
    project.videos[videoId] = video;
    PseudoDatabase.pushProject(project);

    return Promise.resolve(video);
  }

  async databaseTest(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    this.mLService.printJobs();
    return project;
  }
}
