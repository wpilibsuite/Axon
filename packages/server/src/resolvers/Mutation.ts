import { MutationResolvers } from "../schema/__generated__/graphql";

export const Mutation: MutationResolvers = {
  createDataset: async (parent, { upload }, { dataSources }) => {
    const { createReadStream, filename } = await upload;
    return dataSources.datasetService.createDataset(filename, createReadStream());
  },
  createProject: async (parent, { name }, { dataSources }) => {
    return dataSources.projectService.createProject(name);
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
  haltTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.haltTraining(id);
  },
  exportCheckpoint: async (parent, { id, checkpointNumber, name, test, video }, { dataSources }) => {
    if (test){
      let { createReadStream, filename } = await video;
      console.log(filename)
      return dataSources.projectService.exportCheckpoint(id, checkpointNumber, name, test, filename, createReadStream());
    } else {
      return dataSources.projectService.exportCheckpoint(id, checkpointNumber, name, test);
    }

  }
};
