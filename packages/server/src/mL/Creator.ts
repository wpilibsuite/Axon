import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import { CreateJob } from "../schema/__generated__/graphql";

type CreateParameters = {
  labels: string[];
  limit: number;
};

export default class Creator {
  readonly classes: string[];
  readonly maxImages: number;
  readonly directory: string;
  readonly id: string;

  public constructor(classes: string[], maxImages: number, id: string) {
    this.classes = classes;
    this.maxImages = maxImages;
    this.directory = `data/create/${id}`;
    this.id = id;
  }

  public async checkLabels(): Promise<CreateJob> {
    const validLabels = await this.getValidLabels();
    for (let i = 0; i < this.classes.length; i++) {
      if (!validLabels.includes(this.classes[i].toLowerCase())) {
        return {
          success: 0,
          createID: this.classes[i],
          zipPath: ""
        };
      }
    }
    return {
      success: 1,
      createID: "",
      zipPath: ""
    };
  }

  /**
   * Create the training parameter file in the container's mounted directory to control the container.
   */
  public async writeParameterFile(): Promise<void> {
    const createParameters: CreateParameters = {
      labels: this.classes,
      limit: this.maxImages
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.directory, "data.json");
    console.log(`Create config data created at ${HYPERPARAMETER_FILE_PATH}`);
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(createParameters));
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async createDataset(): Promise<void> {
    console.log("Spawning child process");

    const python = spawn("python", ["src/assets/openaxon.py", this.id]);

    python.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    python.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    const exitCode = await new Promise((resolve) => {
      python.on("close", resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}`);
    }
    return;
  }

  public async getValidLabels(): Promise<string[]> {
    const buffer = await fs.promises.readFile("src/assets/valid_labels.json");
    return JSON.parse(buffer.toString());
  }

  public async getZipPath(): Promise<string> {
    const buffer = await fs.promises.readFile(`${this.directory}/output.json`);
    return JSON.parse(buffer.toString())["path"];
  }
}
