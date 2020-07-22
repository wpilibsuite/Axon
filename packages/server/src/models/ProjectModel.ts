import { Context } from "../context";
import { Project } from "../schema/__generated__/graphql";
import * as shortid from "shortid";

export const ProjectModel = {
  create(name: string, { low }: Context): Project {
    const project: Project = {
      id: shortid.generate(),
      name
    };
    low.connection.get("projects").push(project).write();
    return project;
  },
  all({ low }: Context): Project[] {
    return low.connection.get("projects").value();
  },
  findById(id: string, { low }: Context): Project {
    return low.connection.get("projects").find({ id: id }).value();
  }
};
