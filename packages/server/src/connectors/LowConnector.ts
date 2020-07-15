import * as lowdb from "lowdb";
import * as FileAsync from "lowdb/adapters/FileAsync";
import { Dataset, Project } from "../schema/__generated__/graphql";
import { DATA_DIR } from "../constants";
import * as path from "path";

const DB_FILE = path.join(DATA_DIR, "db.json");

interface Database {
  projects: Project[];
  datasets: Dataset[];
}

export default class LowConnector {
  connection: lowdb.LowdbAsync<Database>;

  constructor() {
    this.createConnection(DB_FILE);
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
