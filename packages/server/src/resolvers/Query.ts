import { QueryResolvers } from "../schema/__generated__/graphql";
import { DatasetModel, ProjectModel } from "../models";

export const Query: QueryResolvers = {
  isDockerConnected: async (parent, args, { docker }) => {
    return await docker.isConnected();
  },
  dataset: (parent, { id }, context) => {
    return DatasetModel.findById(id, context);
  },
  datasets: (parent, args, context) => {
    return DatasetModel.all(context);
  },
  project: (_, { id }, context) => {
    let retproject = ProjectModel.findById(id, context);
    retproject["checkpoints"] = [
      {
        step:context.trainer.checkpoint.step,
        metrics:{precision:context.trainer.checkpoint.precision}
      }
    ]
    return retproject
  },
  projects: (_, args, context) => {
    return ProjectModel.all(context);
  }
};
