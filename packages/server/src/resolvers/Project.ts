import { ProjectResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Project: ProjectResolvers = {
  name(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getProjectName(parent.id);
  }
};
