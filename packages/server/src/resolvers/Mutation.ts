import { MutationResolvers } from "../schema/__generated__/graphql";
import { sequelize } from "../store";

export const Mutation: MutationResolvers = {
  resetDocker: async (parent, args, { docker }) => {
    return await docker.reset();
  },
  resetVolume: async (parent, args, { docker }) => {
    const [volume] = await Promise.all([docker.resetVolume(), sequelize.sync({ force: true })]);
    return volume;
  },
  createDataset: async (parent, { classes, maxImages }, { dataSources }) => {
    return dataSources.datasetService.createDataset(classes, maxImages);
  },
  addDataset: async (parent, { upload }, { dataSources }) => {
    const { createReadStream, filename } = await upload;
    return dataSources.datasetService.addDataset(filename, createReadStream());
  },
  renameDataset: async (parent, { id, newName }, { dataSources }) => {
    return dataSources.datasetService.renameDataset(id, newName);
  },
  renameExport: async (parent, { id, newName }, { dataSources }) => {
    return dataSources.projectService.renameExport(id, newName);
  },
  deleteExport: async (parent, { id }, { dataSources }) => {
    return dataSources.projectService.deleteExport(id);
  },
  deleteDataset: async (parent, { id }, { dataSources }) => {
    return dataSources.datasetService.deleteDataset(id);
  },
  createProject: async (parent, { name }, { dataSources }) => {
    return dataSources.projectService.createProject(name);
  },
  renameProject: async (parent, { id, newName }, { dataSources }) => {
    return dataSources.projectService.renameProject(id, newName);
  },
  deleteProject: async (parent, { id }, { dataSources }) => {
    return dataSources.projectService.deleteProject(id);
  },
  updateProject: async (parent, { id, updates }, { dataSources }) => {
    return dataSources.projectService.updateProject(id, updates);
  },
  setDatasetInProject: async (parent, { projectId, datasetId, isIncluded }, { dataSources }) => {
    return dataSources.projectService.setDatasetInProject(projectId, datasetId, isIncluded);
  },
  startTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.startTraining(id);
  },
  stopTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.stopTraining(id);
  },
  stopTesting: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.stopTesting(id);
  },
  pauseTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.pauseTraining(id);
  },
  resumeTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.resumeTraining(id);
  },
  saveVideo: async (parent, { projectID, name, video }, { dataSources }) => {
    const { createReadStream, filename } = await video;
    console.log(filename);
    return dataSources.projectService.saveVideo(projectID, name, filename, createReadStream());
  },
  exportCheckpoint: async (parent, { id, checkpointID }, { dataSources }) => {
    return dataSources.projectService.exportCheckpoint(id, checkpointID);
  },
  testModel: async (parent, { name, projectID, exportID, videoID }, { dataSources }) => {
    return dataSources.projectService.testModel(name, projectID, exportID, videoID);
  },
  deleteTest: async (parent, { id }, { dataSources }) => {
    return dataSources.projectService.deleteTest(id);
  },
  databaseTest: async (parent, { id }, { dataSources }) => {
    return dataSources.projectService.databaseTest(id);
  }
};
