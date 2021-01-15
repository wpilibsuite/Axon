import { Resolvers } from "../schema/__generated__/graphql";
import { Query } from "./Query";
import { Mutation } from "./Mutation";
import { Dataset } from "./Dataset";
import { Project } from "./Project";
import { Export } from "./Export";

export const resolvers: Resolvers = {
  Query,
  Mutation,
  Dataset,
  Project,
  Export
};
