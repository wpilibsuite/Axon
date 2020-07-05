import { Project, Resolvers } from "../generated/graphql";

const resolver: Resolvers = {
  Query: {
    projects: async (_, args, { models }): Promise<Project[]> => {
      const { Project: projectModel } = models;

      return projectModel.findAll();
    },
    project: (_, args, { models }): Promise<Project> => {
      const { Project } = models;

      return Project.findOne({ where: args });
    }
  }
};

export default resolver;
