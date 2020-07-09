import { ApolloServer, PubSub } from "apollo-server";
import DbService from "./db";
import { schema } from "./schema";
import Trainer from './training';

const db = new DbService();
const pubsub = new PubSub();
const trainer = new Trainer();

const server = new ApolloServer({
  schema: schema,
  context: ({
    req
  }): {
    db: DbService;
    pubsub: PubSub;
    trainer: Trainer;
  } => ({
    db,
    pubsub,
    trainer
  }),
  uploads: {
    // Limits here should be stricter than config for surrounding
    // infrastructure such as Nginx so errors can be handled elegantly by
    // graphql-upload:
    // https://github.com/jaydenseric/graphql-upload#type-processrequestoptions
    maxFileSize: 10_000_000_000, // 10 GB
    maxFiles: 20
  }
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 app running at ${url}`);
});
