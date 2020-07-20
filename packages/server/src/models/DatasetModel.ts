import { Context } from "../context";
import { Dataset, LabeledImage, ObjectLabel, Point } from "../schema/__generated__/graphql";
import * as shortid from "shortid";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import SuperviselyDatasetFilestore from "../connectors/SuperviselyDatasetFilestore";

const UPLOAD_DIR = "uploads";
mkdirp.sync(UPLOAD_DIR);

interface FileSystemData {
  classes: string[];
  images: LabeledImage[];
}

async function getFileSystemData(path: string, datasetFilestore: SuperviselyDatasetFilestore): Promise<FileSystemData> {
  const metaData = datasetFilestore.readMetaData(path);

  const data: FileSystemData = <FileSystemData>{};

  data.classes = metaData.classes.map((c) => c.title);
  const images = await datasetFilestore.listImages(path);
  data.images = images.map(
    (image): LabeledImage => ({
      path: image.imagePath,
      size: image.annotation.size,
      tags: image.annotation.tags.map((tag) => tag.name),
      object_labels: image.annotation.objects.map(
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
  );
  return data;
}

export const DatasetModel = {
  all: async function ({ datasetFilestore, low }: Context): Promise<Dataset[]> {
    const datasets = low.connection.get("datasets").value();
    return Promise.all(
      datasets.map(async (dataset) => {
        const fsData = await getFileSystemData(dataset.path, datasetFilestore);
        dataset.classes = fsData.classes;
        dataset.images = fsData.images;
        return dataset;
      })
    );
  },
  async findById(id: string, { datasetFilestore, low }: Context): Promise<Dataset> {
    const dataset = low.connection.get("datasets").find({ id: id }).value();
    const fsData = await getFileSystemData(dataset.path, datasetFilestore);
    dataset.classes = fsData.classes;
    dataset.images = fsData.images;
    return dataset;
  },
  async create(filename: string, stream: fs.ReadStream, { datasetFilestore, low }: Context): Promise<Dataset> {
    const id = shortid.generate();
    const path = await datasetFilestore.create(id, filename, stream);

    const meta = datasetFilestore.readMetaData(path);

    console.log(await JSON.stringify(datasetFilestore.listImages(path)));

    const dateAdded = new Date();
    const dataset: Dataset = {
      images: undefined,
      tags: undefined,
      id,
      dateAdded,
      name: filename,
      path,
      classes: meta.classes.map((c) => c.title)
    };

    low.connection.get("datasets").push(dataset).write();
    return dataset;
  }
};
