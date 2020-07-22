import { DatasetResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Dataset: DatasetResolvers = {
  classes(parent, _, { dataSources }: Context) {
    return dataSources.datasetService.getDatasetClasses(parent.id);
  },
  tags(parent, _, { dataSources }: Context) {
    return dataSources.datasetService.getDatasetTags(parent.id);
  },
  images(parent, _, { dataSources }: Context) {
    return dataSources.datasetService.getDatasetImages(parent.id);
  }
};
