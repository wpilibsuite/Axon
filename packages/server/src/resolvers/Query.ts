import { QueryResolvers } from "../schema/__generated__/graphql";

export const Query: QueryResolvers = {
  isDockerConnected: async () => {
    return true;
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
  }
};
