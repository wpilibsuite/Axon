import * as path from "path";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { addResolversToSchema } from "@graphql-tools/schema";
import { resolvers } from "../resolvers";

export const schema = addResolversToSchema({
  schema: loadSchemaSync(path.join(__dirname, "schema.graphql"), { loaders: [new GraphQLFileLoader()] }),
  resolvers
});
