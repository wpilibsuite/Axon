import * as lowdb from "lowdb";
import * as FileAsync from "lowdb/adapters/FileAsync";
import { Dataset, Project } from "../schema/__generated__/graphql";

interface Database {
  projects: Project[];
  datasets: Dataset[];
}

export default class LowConnector {
  connection: lowdb.LowdbAsync<Database>;

  constructor(path: string) {
    this.createConnection(path);
  }

  private async createConnection(path: string) {
    const adapter = new FileAsync(path);
    const low = await lowdb(adapter);

    await low
      .defaults({
        datasets: [],
        projects: []
      })
      .write();

    this.connection = low;
  }
}
