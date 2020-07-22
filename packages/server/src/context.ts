import { PubSub } from "graphql-subscriptions";
import Trainer from "./training";
import { DockerConnector } from "./connectors";
import { ProjectService } from "./datasources/project-service";
import { DatasetService } from "./datasources/dataset-service";

interface DataSources {
  datasetService: DatasetService;
  projectService: ProjectService;
}

export interface Context {
  docker: DockerConnector;
  pubsub: PubSub;
  trainer: Trainer;
  dataSources: DataSources;
}
