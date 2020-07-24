import { PubSub } from "graphql-subscriptions";
import Trainer from "./training";
import { ProjectService } from "./datasources/project-service";
import { DatasetService } from "./datasources/dataset-service";

interface DataSources {
  datasetService: DatasetService;
  projectService: ProjectService;
}

export interface Context {
  pubsub: PubSub;
  trainer: Trainer;
  dataSources: DataSources;
}
