import { DataSource } from "apollo-datasource";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";
import * as mkdirp from "mkdirp";
import * as unzipper from "unzipper";
import * as tar from "tar";
import { imageSize as sizeOf } from "image-size";
import { glob } from "glob";
import { LabeledImage, ObjectLabel, Point } from "../schema/__generated__/graphql";
import { Sequelize } from "sequelize";
import { Dataset } from "../store";
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
  private readonly path: string;
  private store: Sequelize;

  constructor(store: Sequelize, path: string) {
    super();

    this.path = path;
    this.store = store;
  }

  async getDatasets(): Promise<Dataset[]> {
    return Dataset.findAll();
  }

  async getDataset(id: string): Promise<Dataset> {
    return Dataset.findByPk(id);
  }

  async getDatasetClasses(id: string): Promise<string[]> {
    return this.readMetaData(id).classes.map((c) => c.title);
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

  async createDataset(filename: string, stream: fs.ReadStream): Promise<Dataset> {
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
    const name = (await Dataset.findByPk(id)).name;

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
}
