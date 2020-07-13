import { MutationResolvers } from "../schema/__generated__/graphql";
import { ProjectModel } from "../models";

export const Mutation: MutationResolvers = {
  startTraining: (parent, { id }, context) => {
    const project = ProjectModel.findById(id, context);
    context.trainer.start();
    console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
    return project;
  }
};
