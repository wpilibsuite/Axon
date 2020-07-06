import { PubSub } from "graphql-subscriptions";
import DbService from "./db";

export interface MyContext {
  db: DbService;
  pubsub: PubSub;
}
