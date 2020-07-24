import { ProjectResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Project: ProjectResolvers = {
  hyperparameters(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getHyperparameters(parent.id.toString());
  }
};
