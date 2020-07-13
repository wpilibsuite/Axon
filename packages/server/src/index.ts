import * as Koa from "koa";
import { ApolloServer, PubSub } from "apollo-server-koa";
import { schema } from "./schema";
import Trainer from "./training";
import LowConnector from "./connectors/LowConnector";
import { DockerConnector } from "./connectors";
import * as serve from "koa-static";
import * as mount from "koa-mount";

const docker = new DockerConnector();
const low = new LowConnector("db.json");
const pubsub = new PubSub();
const trainer = new Trainer();

const app = new Koa();
const server = new ApolloServer({
  schema: schema,
  context: {
    docker,
    low,
    pubsub,
    trainer
  },
  uploads: {
    // Limits here should be stricter than config for surrounding
    // infrastructure such as Nginx so errors can be handled elegantly by
    // graphql-upload:
    // https://github.com/jaydenseric/graphql-upload#type-processrequestoptions
    maxFileSize: 10_000_000_000, // 10 GB
    maxFiles: 20
  }
});

app.use(mount("/uploads", serve("uploads")));
server.applyMiddleware({ app });

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.info(`Serving http://localhost:${port}.`);
});
