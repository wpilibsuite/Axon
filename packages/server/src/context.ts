import { PubSub } from "graphql-subscriptions";
import Trainer from "./training";
import { DockerConnector, LowConnector } from "./connectors";
import SuperviselyDatasetFilestore from "./connectors/SuperviselyDatasetFilestore";

export interface Context {
  datasetFilestore: SuperviselyDatasetFilestore;
  docker: DockerConnector;
  low: LowConnector;
  pubsub: PubSub;
  trainer: Trainer;
}
