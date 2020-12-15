import * as Dockerode from "dockerode";
import { DockerImage } from "../schema/__generated__/graphql";
import { Project } from "../store";
import { DATA_DIR, DATASET_DATA_DIR, PROJECT_DATA_DIR } from "../constants";
import * as fs from "fs";
import * as path from "path";
import { Container, ContainerCreateOptions, ContainerInfo } from "dockerode";

type TrainParameters = {
  "eval-frequency": number;
  "dataset-path": string[];
  "percent-eval": number;
  "batch-size": number;
  checkpoint: string;
  epochs: number;
  name: string;
};

const CONTAINER_MOUNT_PATH = "/opt/ml/model";

export class Docker {
  readonly docker;

  constructor(docker: Dockerode) {
    this.docker = docker;
  }

  /**
   * Get the status of the Docker Service.
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.docker.ping();
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Checks if all of our images are downloaded.
   */
  async isImagesReady(): Promise<boolean> {
    try {
      await Promise.all(
        Object.entries(DockerTrainer.images).map(async ([, value]) =>
          this.docker.getImage(`${value.name}:${value.tag}`).inspect()
        )
      );
    } catch (e) {
      return false;
    }

    return true;
  }

  /**
   * Get the docker version number.
   */
  async version(): Promise<string> {
    return (await this.docker.version()).Version;
  }

  /**
   * Reset Docker by removing all containers and pulling images.
   */
  async reset(): Promise<boolean> {
    // Stop active containers that we manage
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        label: ["wpilib=ml"]
      }
    });
    await Promise.all(containers.map(async (container) => this.docker.getContainer(container.Id).stop()));

    await this.pullImages();

    return true;
  }

  /**
   * Pull resources needed for training.
   */
  async pullImages(): Promise<void> {
    await Promise.all(
      Object.entries(DockerTrainer.images).map(async ([, value]) => {
        console.info(`Pulling image ${value.name}:${value.tag}`);
        const stream = await this.docker.pull(`${value.name}:${value.tag}`);
        this.docker.modem.followProgress(stream, () =>
          console.info(`Finished pulling image ${value.name}:${value.tag}`)
        );
      })
    );
  }
}

export abstract class Trainer {
  /**
   * Start training on the given project.
   *
   * @param project The project to start
   */
  abstract start(project: Project): Promise<void>;

  /**
   * Halt training on the given project.
   *
   * @param project The project to halt
   */
  abstract halt(project: Project): Promise<void>;
}

export class DockerTrainer extends Trainer {
  static readonly images: Record<string, DockerImage> = {
    dataset: { name: "gcperkins/wpilib-ml-dataset", tag: "latest" },
    metrics: { name: "gcperkins/wpilib-ml-metrics", tag: "latest" },
    export: { name: "gcperkins/wpilib-ml-tflite", tag: "latest" },
    train: { name: "gcperkins/wpilib-ml-train", tag: "latest" },
    test: { name: "gcperkins/wpilib-ml-test", tag: "latest" }
  };

  readonly docker: Dockerode;

  constructor(docker: Dockerode) {
    super();

    this.docker = docker;
  }

  async start(project: Project): Promise<void> {
    // Validation
    await validateProject(project);

    // Cleanup
    await this.removeContainersForProject(project);
    await cleanProjectWorkingDirectory(project);

    // Prepare
    await writeTrainingHyperparametersToFile(project);
    await copyDatasetsToProject(project);
    await this.convertDataTarsToRecord(project);

    // Train
    const metricsContainer = await this.createContainer(project, DockerTrainer.images.metrics, ["6006/tcp"]);
    await metricsContainer.start();
    await this.runTraining(project);
    await metricsContainer.stop();
    await metricsContainer.remove();
  }

  async halt(project: Project): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   *
   * @param project The project
   * @private
   */
  private async runTraining(project: Project) {
    console.info(`${project.id}: Starting training`);
    const container = await this.createContainer(project, DockerTrainer.images.train);
    await container.start();
    await container.wait();
    await container.remove();
    console.info(`${project.id}: Training complete`);
  }

  /**
   * Convert dataset Tars to TF record. The Tar files need to be in the `dataset` directory of the
   * project working directory.
   *
   * @param project The project
   * @private
   */
  private async convertDataTarsToRecord(project: Project) {
    console.info(`${project.id}: Converting Dataset Tars to TF Record`);
    const container = await this.createContainer(project, DockerTrainer.images.dataset);
    await container.start();
    await container.wait();
    await container.remove();
    console.info(`${project.id}: Datasets Tars converted to TF Record`);
  }

  /**
   * Create a container for the provided project with the given image. Opens and binds ports as provided.
   *
   * If the container already exists (as known by its name), it will remove that container first.
   *
   * @param project The project for this container
   * @param image The image to base this container on
   * @param ports The ports to expose
   * @private
   */
  private async createContainer(project: Project, image: DockerImage, ports: [string?] = []): Promise<Container> {
    console.info(`${project.id}: Launching container ${image.name}`);

    const localMountPath = getProjectWorkingDirectory(project).replace("C:\\", "/c/").replace(/\\/g, "/");
    const options: ContainerCreateOptions = {
      Image: `${image.name}:${image.tag}`,
      name: `wpilib-${image.name.replaceAll("/", "_")}-${project.id}`,
      Labels: {
        wpilib: "ml",
        "wpilib-ml-name": image.name,
        "wpilib-ml-id": project.id
      },
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      Tty: true,
      Volumes: { [CONTAINER_MOUNT_PATH]: {} },
      HostConfig: {
        Binds: [`${localMountPath}:${CONTAINER_MOUNT_PATH}:rw`],
        PortBindings: Object.assign({}, ...ports.map((port) => ({ [port]: [{ HostPort: port.split("/")[0] }] })))
      },
      ExposedPorts: Object.assign({}, ...ports.map((port) => ({ [port]: {} })))
    };

    const container = await this.docker.createContainer(options);
    (await container.attach({ stream: true, stdout: true, stderr: true })).pipe(process.stdout);

    return container;
  }

  /**
   * Removes containers associated with a given project.
   *
   * @param project The project
   * @private
   */
  private async removeContainersForProject(project: Project): Promise<void[]> {
    console.info(`${project.id}: Removing containers`);

    const containerInfos = await this.docker.listContainers({
      all: true,
      filters: {
        label: ["wpilib=ml", `wpilib-ml-id=${project.id}`]
      }
    });
    return Promise.all(
      containerInfos.map(async (containerInfo: ContainerInfo) => {
        console.info(`${project.id}: Removing container ${containerInfo.Id}`);
        const container = await this.docker.getContainer(containerInfo.Id);

        if ((await container.inspect()).State.Running) {
          await container.kill({ force: true });
        }
        return container.remove();
      })
    );
  }
}

/**
 * Copy all selected datasets to the project working directory.
 *
 * @param project The project
 */
async function copyDatasetsToProject(project: Project): Promise<void[]> {
  console.info(`${project.id}: Copying datasets`);

  const datasets = await project.getDatasets();
  const destinationDir = path.posix.join(getProjectWorkingDirectory(project), "dataset");

  await fs.promises.mkdir(destinationDir);
  return Promise.all(
    datasets.map(async (dataset) =>
      fs.promises.copyFile(
        path.posix.join(DATA_DIR, dataset.path),
        path.posix.join(destinationDir, path.basename(dataset.path))
      )
    )
  );
}

/**
 * Validate the project options to make sure we can start training.
 *
 * @param project The project to validate
 * @private
 */
async function validateProject(project: Project): Promise<boolean> {
  console.info(`${project.id}: Validating project`);
  const datasets = await project.getDatasets();
  if (datasets.length == 0) {
    console.warn(`${project.id}: Invalid project (dataset length)`);
    return false;
  }

  if (project.batchSize <= 0) {
    console.warn(`${project.id}: Invalid project (batch size)`);
    return false;
  }

  if (project.epochs <= 0) {
    console.warn(`${project.id}: Invalid project (epochs)`);
    return false;
  }

  console.info(`${project.id}: Project validated`);
  return true;
}

/**
 * Get the working directory of a project.
 *
 * @param project The project to get the working directory of
 */
function getProjectWorkingDirectory(project: Project): string {
  return `${PROJECT_DATA_DIR}/${project.id}`.replace(/\\/g, "/");
}

/**
 * Cleans the project working directory by deleting the directory and recreating it.
 *
 * @param project The project
 */
async function cleanProjectWorkingDirectory(project: Project): Promise<void> {
  if (fs.existsSync(getProjectWorkingDirectory(project))) {
    await fs.promises.rmdir(getProjectWorkingDirectory(project), { recursive: true });
  }
  return fs.promises.mkdir(getProjectWorkingDirectory(project));
}

/**
 * Create and write the hyperparameters.json file for a given project.
 *
 * @param project The project
 */
async function writeTrainingHyperparametersToFile(project: Project): Promise<void> {
  console.info(`${project.id}: Writing project hyperparameters to file`);
  const datasetsPaths = (await project.getDatasets()).map((dataset) =>
    path.posix.join(CONTAINER_MOUNT_PATH, "dataset", path.basename(dataset.path))
  );
  const initialCheckpoint =
    project.initialCheckpoint !== "default"
      ? path.posix.join("checkpoints", project.initialCheckpoint)
      : project.initialCheckpoint;

  const trainParameters: TrainParameters = {
    "eval-frequency": project.evalFrequency,
    "percent-eval": project.percentEval,
    "batch-size": project.batchSize,
    "dataset-path": datasetsPaths,
    epochs: project.epochs,
    checkpoint: initialCheckpoint,
    name: project.name
  };

  return fs.promises.writeFile(
    path.posix.join(getProjectWorkingDirectory(project), "hyperparameters.json"),
    JSON.stringify(trainParameters, null, 2)
  );
}
