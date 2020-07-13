import { PubSub } from "graphql-subscriptions";
import Trainer from "./training";
import { DockerConnector, LowConnector } from "./connectors";

export interface Context {
  docker: DockerConnector;
  low: LowConnector;
  pubsub: PubSub;
  trainer: Trainer;
}
