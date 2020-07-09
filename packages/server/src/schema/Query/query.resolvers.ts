import { Resolvers } from "../__generated__/graphql";

const resolvers: Resolvers = {
  Query: {
    time: () => {
      return new Date();
    }
  }
};

export default resolvers;
