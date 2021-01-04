import { DataSource } from "apollo-datasource";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";
import * as mkdirp from "mkdirp";
import * as tar from "tar";
import { glob } from "glob";
import { LabeledImage, ObjectLabel, Point } from "../schema/__generated__/graphql";
import { Sequelize } from "sequelize";
import { Dataset } from "../store";

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
    return this.listImages(id);
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

  private readMetaData(id: string): SuperviselyMeta {
    const META_FILE = path.join(`${this.path}/${id}`, "meta.json");
    return JSON.parse(fs.readFileSync(META_FILE).toString());
  }

  private async listImages(id: string): Promise<LabeledImage[]> {
    const imageMetaPaths = glob.sync(`${this.path}/${id}/*/ann/*.json`);
    return Promise.all(
      imageMetaPaths
        .map(
          async (metaPath): Promise<SuperviselyImage> => {
            return {
              imagePath: metaPath
                .replace("data/datasets", "datasets")
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

    await tar.extract({ file: savePath, cwd: extractPath, strip: 1 });
  }
}
