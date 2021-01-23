import { ExportResolvers } from "../schema/__generated__/graphql";
import { Context } from "../context";

export const Export: ExportResolvers = {
  tests(parent, _, { dataSources }: Context) {
    return dataSources.projectService.getTests(parent.id);
  }
};
