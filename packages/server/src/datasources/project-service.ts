import { DataSource } from "apollo-datasource";
import * as lowdb from "lowdb";
import * as FileAsync from "lowdb/adapters/FileAsync";
import { Project } from "../schema/__generated__/graphql";
import * as shortid from "shortid";
import * as Lowdb from "lowdb";
import * as path from "path";

interface Database {
  projects: Project[];
}

async function createStore(storePath: string): Promise<{ low: lowdb.LowdbAsync<Database> }> {
  const dbFile = path.join(storePath, "db.json");
  const adapter = new FileAsync(dbFile);
  const low = await lowdb(adapter);

  await low
    .defaults({
      projects: []
    })
    .write();

  return { low };
}

export class ProjectService extends DataSource {
  private store: Promise<{ low: Lowdb.LowdbAsync<Database> }>;

  constructor(path: string) {
    super();
    this.store = createStore(path);
  }

  async getProjects(): Promise<Project[]> {
    return (await this.store).low.get("projects").value();
  }

  async getProject(id: string): Promise<Project> {
    return (await this.store).low.get("projects").find({ id }).value();
  }

  async getProjectName(id: string): Promise<string> {
    return (await this.store).low.get("projects").find({ id }).value().name;
  }

  async createProject(name: string): Promise<Project> {
    const project: Project = {
      id: shortid.generate(),
      name
    };
    (await this.store).low.get("projects").push(project).write();
    return project;
  }
}
