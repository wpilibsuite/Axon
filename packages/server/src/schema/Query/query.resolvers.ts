import { Resolvers } from "../__generated__/graphql";

const resolvers: Resolvers = {
  Query: {
    hello: (_, __, context) => {
      return "Hello!";
    }
  }
};

export default resolvers;
