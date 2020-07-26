import { ProjectResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Project: ProjectResolvers = {
  checkpoints(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getCheckpoints(parent.id);
  }
};
