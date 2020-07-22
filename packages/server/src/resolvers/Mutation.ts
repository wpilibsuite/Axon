import { MutationResolvers } from "../schema/__generated__/graphql";

export const Mutation: MutationResolvers = {
  createDataset: async (parent, { upload }, { dataSources }) => {
    const { createReadStream, filename } = await upload;
    return dataSources.datasetService.createDataset(filename, createReadStream());
  },
  createProject: async (parent, { name }, { dataSources }) => {
    return dataSources.projectService.createProject(name);
  },
  startTraining: (parent, { id }, { dataSources }) => {
    const project = dataSources.projectService.getProject(id);
    // trainer.start(id, project.hyperparameters);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  },
  haltTraining: (parent, { id }, { dataSources }) => {
    const project = dataSources.projectService.getProject(id);
    // context.trainer.halt(id);
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }
};
