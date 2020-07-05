import { DataSource } from "apollo-datasource";
import { IDataSources } from "./index";

export default class ProjectSource extends DataSource {
  private projectModel;
  private context: IDataSources;

  constructor(projectModel) {
    super();
    this.projectModel = projectModel;
  }

  initialize(config) {
    this.context = config.context.context;
  }

  async getAllProjects() {
    return await this.projectModel.getAll();
  }
}
