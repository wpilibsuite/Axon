import { Project, Resolvers } from "../generated/graphql";

const resolver: Resolvers = {
  Query: {
    projects: async (_, args, { db }) => {
      return db.db.get("projects").value();
    },
    project: (_, args, { db }) => {
      return db.db.get("projects").find({ id: args.id }).value();
    }
  }
};

export default resolver;
