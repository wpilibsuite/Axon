import { join } from "path";
import { makeExecutableSchema } from "graphql-tools";
import { typeDefs } from "./__generated__/graphql";
import { mergeResolvers } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";

const resolvers = mergeResolvers(loadFilesSync(join(__dirname, "./**/*.resolvers.*")));

const schema = makeExecutableSchema({ typeDefs, resolvers });

export { schema };
