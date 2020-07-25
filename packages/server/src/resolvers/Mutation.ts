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
  startTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.startTraining(id);
  },
  haltTraining: (parent, { id }, { dataSources }) => {
    return dataSources.projectService.haltTraining(id);
  }
};
