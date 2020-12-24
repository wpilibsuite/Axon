import { PubSub } from "graphql-subscriptions";
import { ProjectService } from "./datasources/project-service";
import { DatasetService } from "./datasources/dataset-service";
import Docker from "./mL/Docker";

interface DataSources {
  datasetService: DatasetService;
  projectService: ProjectService;
}

export interface Context {
  pubsub: PubSub;
  docker: Docker;
  dataSources: DataSources;
}
