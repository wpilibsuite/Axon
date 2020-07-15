import { MutationResolvers } from "../schema/__generated__/graphql";
import { DatasetModel, ProjectModel } from "../models";

export const Mutation: MutationResolvers = {
  createDataset: async (parent, { upload }, context) => {
    const { createReadStream, filename } = await upload;
    return DatasetModel.create(filename, createReadStream(), context);
  },
  startTraining: (parent, { id }, context) => {
    const project = ProjectModel.findById(id, context);
    context.trainer.start(id, project.name, project.hyperparameters);
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  },
  haltTraining: (parent, { id }, context) => {
    const project = ProjectModel.findById(id, context);
    context.trainer.halt(id);
    console.log(`HALTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }
};
