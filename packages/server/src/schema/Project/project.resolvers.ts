import { Resolvers } from "../__generated__/graphql";

const resolvers: Resolvers = {
  Query: {
    project: (_, args, { db }) => {
      return db.db.get("projects").find({ id: args.id }).value();
    },
    projects: async (_, args, { db }) => {
      return db.db.get("projects").value();
    }
  },
  Mutation: {
    startTraining: (parent, args, { db, trainer }) => {
      const project = db.db.get("projects").find({ id: args.id }).value();
      trainer.start();
      console.log(`STARTED Training on project: ${JSON.stringify(project)}`);
      return project;
    }
  }
};

export default resolvers;
