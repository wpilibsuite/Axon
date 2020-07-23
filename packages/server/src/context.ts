import { PubSub } from "graphql-subscriptions";
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
  dataSources: DataSources;
}
