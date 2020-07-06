import { PubSub } from "graphql-subscriptions";
import DbService from "../db";

export interface GraphQLContext {
  db: DbService;
  pubsub: PubSub;
}
