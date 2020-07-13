import { Context } from "../context";
import { Project } from "../schema/__generated__/graphql";

export const ProjectModel = {
  all({ low }: Context): Project[] {
    return low.connection.get("projects").value();
  },
  findById(id: string, { low }: Context): Project {
    return low.connection.get("projects").find({ id: id }).value();
  }
};
