import { Resolvers } from "../__generated__/graphql";

const resolvers: Resolvers = {
  Query: {
    project: (_, args, { db }) => {
      return db.db.get("projects").find({ id: args.id }).value();
    },
    projects: async (_, args, { db }) => {
      return db.db.get("projects").value();
    }
  }
};

export default resolvers;
