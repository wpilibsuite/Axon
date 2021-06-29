import { ProjectResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Project: ProjectResolvers = {
  dataset(parent) {
    return parent.getDataset();
  },
  checkpoints(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getCheckpoints(parent.id);
  },
  exports(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getExports(parent.id);
  },
  videos(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getVideos(parent.id);
  }
};
