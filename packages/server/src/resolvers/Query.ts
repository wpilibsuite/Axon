import { QueryResolvers } from "../schema/__generated__/graphql";
import { DatasetModel, ProjectModel } from "../models";
import * as fs from "fs";

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

    const data = fs.readFileSync(`mount/${id}/metrics.json`, "utf8");
    try {
      const metrics = JSON.parse(data);
      let currentstep = 0;
      for (var step in metrics.precision) {
        currentstep = currentstep < parseInt(step) ? parseInt(step) : currentstep;
      }
      retproject["checkpoints"] = [
        {
          step: currentstep,
          metrics: { precision: metrics.precision[currentstep.toString(10)] }
        }
      ];
      console.log("current step: ", currentstep);
    } catch (err) {
      console.log("could not read metrics", err);
    }
    return retproject;
  },

  projects: (_, args, context) => {
    return ProjectModel.all(context);
  }
};
