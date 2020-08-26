import { ProjectResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Project: ProjectResolvers = {
  datasets(parent) {
    return parent.getDatasets();
  },
  checkpoints(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getCheckpoints(parent.id);
  },
  exports(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getExports(parent.id);
  },
  status(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getStatus(parent.id);
  }
};
