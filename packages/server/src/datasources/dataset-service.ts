import { DataSource } from "apollo-datasource";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";
import * as mkdirp from "mkdirp";
import * as unzipper from "unzipper";
import * as tar from "tar";
import { imageSize as sizeOf } from "image-size";
import { glob } from "glob";
import { CreateJob, LabeledImage, ObjectLabel, Point } from "../schema/__generated__/graphql";
import { Sequelize } from "sequelize";
import { Dataset } from "../store";
import MLService from "../mL";
import rimraf = require("rimraf");

interface SuperviselyMeta {
  classes: {
    title: string;
    shape: string;
    color: string;
  }[];
  tags: {
    name: string;
    value_type: string;
    color: string;
  }[];
}

interface SuperviselyImage {
  imagePath: string;
  annotation: {
    description: string;
    tags: {
      name: string;
    }[];
    size: {
      width: number;
      height: number;
    };
    objects: {
      classTitle: string;
      points: {
        exterior: number[][];
      };
    }[];
  };
}

export class DatasetService extends DataSource {
  private readonly mLService: MLService;
  private readonly path: string;
  private store: Sequelize;

  constructor(store: Sequelize, mLService: MLService, path: string) {
    super();
    this.path = path;
    this.mLService = mLService;
    this.store = store;
  }

  async getDatasets(): Promise<Dataset[]> {
    return Dataset.findAll();
  }

  async getDataset(id: string): Promise<Dataset> {
    return Dataset.findByPk(id);
  }

  async getDatasetClasses(id: string): Promise<string[]> {
    const dataset = await this.getDataset(id);
    if (fs.existsSync(path.join(`${this.path}/${id}`, "meta.json"))) {
      // supervise.ly
      const META_FILE = path.join(`${this.path}/${id}`, "meta.json");
      const meta = JSON.parse(fs.readFileSync(META_FILE).toString());
      return meta.classes.map((c) => c.title);
    }
    const META_FILE = path.join(this.path.replace("datasets", ""), `${dataset.path.replace(".zip", "")}`, "meta.json");
    const meta = JSON.parse(fs.readFileSync(META_FILE).toString());
    console.log(`labels: ${JSON.stringify(meta)}`);
    return meta.labels;
  }

  async getDatasetTags(id: string): Promise<string[]> {
    return this.readMetaData(id).tags.map((t) => t.name);
  }

  async getDatasetImages(id: string): Promise<LabeledImage[]> {
    let images: LabeledImage[] = [];
    try {
      images = await this.listImages(id);
    } catch (e) {
      console.log(e);
    }
    return images;
  }

  async createDataset(classes: string[], maxImages: number): Promise<CreateJob> {
    console.log("Creating new dataset");
    const dataset = Dataset.build({ name: classes[0] });
    await mkdirp(`data/datasets/${dataset.id}`);
    await mkdirp("data/create");
    const createJob = await this.mLService.create(classes, maxImages, dataset.id);
    const name = createJob.zipPath.split("/")[1]; // OpenImages_ETC.zip
    dataset.name = name.replace("OpenImages_", "").replace(".zip", ""); // ETC
    dataset.path = `datasets/${dataset.id}/${name}`;
    const zipPath = `${this.path}/${createJob.zipPath}`;
    fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: zipPath.replace(".zip", "") }));
    await dataset.save();
    return createJob;
  }

  async addDataset(filename: string, stream: fs.ReadStream): Promise<Dataset> {
    const dataset = Dataset.build({ name: filename });
    dataset.path = `datasets/${dataset.id}/${filename}`;
    await this.upload(dataset.id, dataset.name, stream).then(() => dataset.save());
    return dataset;
  }

  async renameDataset(id: string, newName: string): Promise<Dataset> {
    const dataset = await this.getDataset(id);
    dataset.name = newName;
    return dataset.save();
  }

  async deleteDataset(id: string): Promise<Dataset> {
    const dataset = await Dataset.findByPk(id);
    await new Promise((resolve) => rimraf(dataset.path, resolve));
    await dataset.destroy();
    return dataset;
  }

  private readMetaData(id: string): SuperviselyMeta {
    const META_FILE = path.join(`${this.path}/${id}`, "meta.json");
    return JSON.parse(fs.readFileSync(META_FILE).toString());
  }

  private async listImages(id: string): Promise<LabeledImage[]> {
    const name = (await Dataset.findByPk(id)).path;

    if (name.slice(name.length - 4) === ".tar") {
      const imageMetaPaths = glob.sync(`${this.path}/${id}/*/ann/*.json`);
      return Promise.all(
        imageMetaPaths
          .map(
            async (metaPath): Promise<SuperviselyImage> => {
              return {
                imagePath: metaPath
                  .replace("/usr/src/app/packages/server/data/datasets", "datasets")
                  .replace("ann", "img")
                  .replace(/\.[^/.]+$/, ""),
                annotation: JSON.parse((await fs.promises.readFile(metaPath)).toString())
              };
            }
          )
          .map(
            async (image): Promise<LabeledImage> => ({
              path: (await image).imagePath,
              size: (await image).annotation.size,
              tags: (await image).annotation.tags.map((tag) => tag.name),
              object_labels: (await image).annotation.objects.map(
                (o): ObjectLabel => ({
                  className: o.classTitle,
                  points: o.points.exterior.map(
                    (p): Point => ({
                      x: p[0],
                      y: p[1]
                    })
                  )
                })
              )
            })
          )
      );
    } else if (name.slice(name.length - 4) === ".zip") {
      const imagePaths = glob.sync(`${this.path}/${id}/**/*.jpg`);
      return Promise.all(
        imagePaths.map(
          async (imagePath): Promise<LabeledImage> => {
            const dimensions = await sizeOf(imagePath);
            return {
              path: imagePath.replace("/usr/src/app/packages/server/data/datasets", "datasets"),
              size: { width: dimensions.width, height: dimensions.height },
              tags: [],
              object_labels: []
            };
          }
        )
      );
    } else {
      return [];
    }
  }

  private async upload(id: string, name: string, stream: fs.ReadStream) {
    const extractPath = `${this.path}/${id}`;
    const savePath = path.join(extractPath, name);
    console.log(`Save path ${savePath}`);
    await mkdirp(extractPath);

    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(savePath);
      writeStream.on("finish", resolve);
      writeStream.on("error", (error) => {
        unlink(extractPath, () => {
          reject(error);
        });
      });
      stream.on("error", (error) => writeStream.destroy(error));
      stream.pipe(writeStream);
    });

    if (name.slice(name.length - 4) === ".tar") await tar.extract({ file: savePath, cwd: extractPath, strip: 1 });
    if (name.slice(name.length - 4) === ".zip")
      fs.createReadStream(savePath).pipe(unzipper.Extract({ path: savePath.replace(".zip", "") }));
  }

  async reset(): Promise<boolean> {
    const datasets = await this.getDatasets();
    for (const dataset of datasets) {
      await dataset.destroy();
    }
    return true;
  }
}
