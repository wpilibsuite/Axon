import { ApolloServer, PubSub } from "apollo-server";
import { importSchema } from "graphql-import";
import { allResolvers } from "./resolvers";
import models, { ModelType } from "./models";

const pubsub = new PubSub();

const server = new ApolloServer({
  typeDefs: importSchema("schemas/schema.graphql"),
  context: ({
    req
  }): {
    models: ModelType;
    pubsub: PubSub;
  } => ({
    models,
    pubsub
  }),
  resolvers: allResolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
