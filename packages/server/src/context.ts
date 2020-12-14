import { PubSub } from "graphql-subscriptions";
import { ProjectService } from "./datasources/project-service";
import { DatasetService } from "./datasources/dataset-service";
import { Docker } from "./training/docker";

interface DataSources {
  datasetService: DatasetService;
  projectService: ProjectService;
}

export interface Context {
  pubsub: PubSub;
  dataSources: DataSources;
  docker: Docker;
}
