import * as Koa from "koa";
import { ApolloServer, PubSub } from "apollo-server-koa";
import { schema } from "./schema";
import Trainer from "./training";
import * as serve from "koa-static";
import * as mount from "koa-mount";
import { ProjectService } from "./datasources/project-service";
import { DATASET_DATA_DIR } from "./constants";
import { Context } from "./context";
import { DatasetService } from "./datasources/dataset-service";
import { sequelize } from "./store";

const pubsub = new PubSub();
const trainer = new Trainer();
const pubsub = new PubSub();

const app = new Koa();
const server = new ApolloServer({
  schema: schema,
  dataSources: () => ({
    datasetService: new DatasetService(sequelize, DATASET_DATA_DIR),
    projectService: new ProjectService(sequelize)
  }),
  context: {
    pubsub,
    trainer
  } as Context,
  uploads: {
    // Limits here should be stricter than config for surrounding
    // infrastructure such as Nginx so errors can be handled elegantly by
    // graphql-upload:
    // https://github.com/jaydenseric/graphql-upload#type-processrequestoptions
    maxFileSize: 10_000_000_000, // 10 GB
    maxFiles: 20
  }
});

app.use(mount("/datasets", serve(DATASET_DATA_DIR)));
server.applyMiddleware({ app });

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.info(`Serving http://localhost:${port}.`);
});
