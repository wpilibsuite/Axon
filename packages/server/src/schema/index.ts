import { makeExecutableSchema } from "graphql-tools";
import { resolvers } from "../resolvers";
import { typeDefs } from "./__generated__/graphql";

export const schema = makeExecutableSchema({ typeDefs, resolvers });
