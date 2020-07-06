import { ApolloServer, PubSub } from "apollo-server";
import { importSchema } from "graphql-import";
import { allResolvers } from "./resolvers";
import DbService from "./db";

const db = new DbService();
const pubsub = new PubSub();

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
  resolvers: allResolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
