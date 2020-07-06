import * as lowdb from "lowdb";
import * as FileAsync from "lowdb/adapters/FileAsync";
import { Project } from "../schema/__generated__/graphql";

interface Database {
  projects: Array<Project>;
}

export default class DbService {
  db: lowdb.LowdbAsync<Database>;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    const adapter = new FileAsync("db.json");
    this.db = await lowdb(adapter);

    await this.db
      .defaults({
        projects: []
      })
      .write();
  }
}
