import { ProjectUpdateInput, Trainjob, Testjob, Exportjob, DockerState } from "../schema/__generated__/graphql";
import { Project, Export, Checkpoint, Video } from "../store";
import { PROJECT_DATA_DIR } from "../constants";
import { DataSource } from "apollo-datasource";
import { createWriteStream, unlink } from "fs";
import { Sequelize } from "sequelize";
import * as mkdirp from "mkdirp";
import MLService from "../mL";
import * as path from "path";
import * as fs from "fs";
import rimraf = require("rimraf");

export class ProjectService extends DataSource {
  private readonly mLService: MLService;
  private readonly store: Sequelize;
  private readonly path: string;

  constructor(store: Sequelize, mLService: MLService, path: string) {
    super();
    this.mLService = mLService;
    this.store = store;
    this.path = path;
  }

  async getProjects(): Promise<Project[]> {
    return Project.findAll();
  }

  async getProject(id: string): Promise<Project> {
    return Project.findByPk(id);
  }

  async createProject(name: string): Promise<Project> {
    const project = Project.build({ name });

    /* derive project directory from id, store in object, create folders before saving */
    const mkProjDir = async (folder: string) => mkdirp(path.posix.join(project.directory, folder));
    project.directory = path.posix.join(PROJECT_DATA_DIR, project.id);
    await mkdirp(project.directory);
    await mkProjDir("checkpoints");
    await mkProjDir("exports");
    await mkProjDir("dataset");
    await mkProjDir("tests");

    return project.save();
  }

  async renameProject(id: string, newName: string): Promise<Project> {
    const project = await this.getProject(id);
    project.name = newName;
    return project.save();
  }

  async renameExport(id: string, newName: string): Promise<Export> {
    const exprt = await Export.findByPk(id);
    const newFilename = `${newName}.tar.gz`;
    exprt.downloadPath = exprt.downloadPath.replace(exprt.tarfileName, newFilename);
    await fs.promises.rename(
      path.posix.join(exprt.directory, exprt.tarfileName),
      path.posix.join(exprt.directory, newFilename)
    );
    exprt.tarfileName = newFilename;
    exprt.name = newName;
    return exprt.save();
  }

  async deleteProject(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    await new Promise((resolve) => rimraf(project.directory, resolve));
    await project.destroy();
    return project;
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

  async startTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    this.mLService.start(project);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }

  async stopTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    console.log(`stopping training on project: ${JSON.stringify(project)}`);
    this.mLService.stop(project);
    return project;
  }

  async pauseTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    console.log(`pausing training on project: ${JSON.stringify(project)}`);
    this.mLService.pauseTraining(project);
    return project;
  }

  async resumeTraining(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    console.log(`resuming training on project: ${JSON.stringify(project)}`);
    this.mLService.resumeTraining(project);
    return project;
  }

  async exportCheckpoint(id: string, checkpointID: string, name: string): Promise<Project> {
    const project = await Project.findByPk(id);
    console.log(`Started export on checkpoint: ${checkpointID}`);
    this.mLService.export(project, checkpointID, name);
    return project;
  }

  async testModel(name: string, projectID: string, exportID: string, videoID: string): Promise<Project> {
    const project = await Project.findByPk(projectID);
    console.log(`Started test on export: ${exportID} \nVideo: ${videoID}`);
    this.mLService.test(name, project, exportID, videoID);
    return project;
  }

  async saveVideo(id: string, name: string, filename: string, stream: fs.ReadStream): Promise<Video> {
    const project: Project = await Project.findByPk(id);

    /* make video object */
    const video = Video.build({ name, filename });

    /* derive its path, store in the object, make its directory */
    const videoDir: string = path.posix.join(project.directory, "videos", video.id);
    video.fullPath = path.posix.join(videoDir, filename);
    await mkdirp(videoDir);

    /* download video from client, store in assigned directory */
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(video.fullPath);
      writeStream.on("finish", resolve);
      writeStream.on("error", (error) => {
        unlink(videoDir, () => {
          reject(error);
        });
      });
      stream.on("error", (error) => writeStream.destroy(error));
      stream.pipe(writeStream);
    });

    /* save video object in database, link to its project */

    video.save();
    project.addVideo(video);
    return Promise.resolve(video);
  }

  async getCheckpoints(id: string): Promise<Checkpoint[]> {
    await this.mLService.updateCheckpoints(id);
    const project = await this.getProject(id);
    return project.getCheckpoints({ order: [["step", "ASC"]] });
  }

  async getExports(id: string): Promise<Export[]> {
    const project = await this.getProject(id);
    return project.getExports({ order: [["createdAt", "ASC"]] });
  }

  async getVideos(id: string): Promise<Video[]> {
    const project = await Project.findByPk(id);
    return project.getVideos({ order: [["createdAt", "ASC"]] });
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

  async getDockerState(): Promise<DockerState> {
    return this.mLService.getDockerState();
  }

  /**
   * a function called by a mutation from the client. Use this for testing anything.
   */
  async databaseTest(id: string): Promise<Project> {
    const project = await Project.findByPk(id);
    return project;
  }
}
