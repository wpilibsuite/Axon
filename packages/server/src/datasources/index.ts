import { DataSources } from "apollo-server-core/dist/graphqlOptions";
import ProjectSource from "./project";

export interface IDataSources {
  projects: ProjectSource;
}

export function buildDataSources(models) {
  return {
    projects: new ProjectSource(models.Project)
  } as DataSources<IDataSources>;
}
