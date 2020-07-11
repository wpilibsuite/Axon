import { PubSub } from "graphql-subscriptions";
import DbService from "../db";
import Trainer from "../training";

export interface GraphQLContext {
  db: DbService;
  pubsub: PubSub;
  trainer: Trainer;
}
