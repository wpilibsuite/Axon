import { ApolloServer, PubSub } from "apollo-server";
import { schema } from "./schema";
import Trainer from "./training";
import LowConnector from "./connectors/LowConnector";
import { DockerConnector } from "./connectors";

const docker = new DockerConnector();
const low = new LowConnector("db.json");
const pubsub = new PubSub();
const trainer = new Trainer();

const server = new ApolloServer({
  schema: schema,
  context: ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    req
  }): {
    docker: DockerConnector;
    low: LowConnector;
    pubsub: PubSub;
    trainer: Trainer;
  } => ({
    docker,
    low,
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
