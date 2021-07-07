import { QueryResolvers } from "../schema/__generated__/graphql";

export const Query: QueryResolvers = {
  isDockerConnected: async (parent, args, { docker }) => {
    return await docker.isConnected();
  },
  getAxonVersion: async (parent, args, { docker }) => {
    return docker.getAxonVersion();
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
  export: (_, { id }, { dataSources }) => {
    return dataSources.projectService.getExport(id);
  },
  projects: (_, args, { dataSources }) => {
    return dataSources.projectService.getProjects();
  },
  dockerState: (_, args, { dataSources }) => {
    return dataSources.projectService.getDockerState();
  },
  trainjobs: (_, args, { dataSources }) => {
    return dataSources.projectService.getTrainjobs();
  },
  exportjobs: (_, args, { dataSources }) => {
    return dataSources.projectService.getExportjobs();
  },
  testjobs: (_, args, { dataSources }) => {
    return dataSources.projectService.getTestjobs();
  },
  validLabels: (_, args, { dataSources }) => {
    return dataSources.datasetService.getValidLabels();
  }
};
