import { ModelType } from "./models";
import { PubSub } from "graphql-subscriptions";

export interface MyContext {
  models: ModelType;
  pubsub: PubSub;
}
