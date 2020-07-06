import { ApolloServer, PubSub } from "apollo-server-koa";
import * as Koa from "koa";
import { importSchema } from "graphql-import";
import { allResolvers } from "./resolvers";
import DbService from "./db";

const db = new DbService();
const pubsub = new PubSub();

const app = new Koa();

const server = new ApolloServer({
  typeDefs: importSchema("schemas/schema.graphql"),
  context: ({
    req
  }): {
    db: DbService;
    pubsub: PubSub;
  } => ({
    db,
    pubsub
  }),
  resolvers: allResolvers,
  uploads: {
    // Limits here should be stricter than config for surrounding
    // infrastructure such as Nginx so errors can be handled elegantly by
    // graphql-upload:
    // https://github.com/jaydenseric/graphql-upload#type-processrequestoptions
    maxFileSize: 10_000_000_000, // 10 GB
    maxFiles: 20
  }
});

server.applyMiddleware({ app });

app.listen(3001, () => {
  console.info(`🚀 Server ready at  http://localhost:3001`);
});
