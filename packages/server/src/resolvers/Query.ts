import { QueryResolvers } from "../schema/__generated__/graphql";

export const Query: QueryResolvers = {
  isDockerConnected: async (parent, args, { docker }) => {
    return await docker.isConnected();
  },
  isDockerImagesReady: async (parent, args, { docker }) => {
    return await docker.isImagesReady();
  },
  dockerVersion: async (parent, args, { docker }) => {
    return await docker.version();
  },
  dataset: (parent, { id }, { dataSources }) => {
    return dataSources.datasetService.getDataset(id);
  },
  datasets: async (parent, args, { dataSources }) => {
    return await dataSources.datasetService.getDatasets();
  },
  project: (_, { id }, { dataSources }) => {
    return dataSources.projectService.getProject(id);
  },
  projects: (_, args, { dataSources }) => {
    return dataSources.projectService.getProjects();
  },
  trainerState: (_, args, { dataSources }) => {
    return dataSources.projectService.getTrainerState();
  }
};
