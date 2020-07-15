import * as mkdirp from "mkdirp";
import * as path from "path";
import { DATA_DIR } from "../constants";
import * as fs from "fs";
import { createWriteStream, unlink } from "fs";
import * as tar from "tar";
import { glob } from "glob";

export const DATASET_DIR = path.join(DATA_DIR, "datasets");
mkdirp.sync(DATASET_DIR);

interface SuperviselyMeta {
  classes: {
    title: string;
    shape: string;
    color: string;
  }[];
}

interface SuperviselyImageAnnotation {
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
}

interface SuperviselyImage {
  imagePath: string;
  annotation: SuperviselyImageAnnotation;
}

export default class SuperviselyDatasetFilestore {
  listImages(datasetPath: string): Promise<SuperviselyImage[]> {
    const imageMetaPaths = glob.sync(`${datasetPath}/*/ann/*.json`);
    return Promise.all(
      imageMetaPaths.map(
        async (metaPath): Promise<SuperviselyImage> => {
          return {
            imagePath: metaPath.replace("ann", "img").replace(/\.[^/.]+$/, ""),
            annotation: JSON.parse((await fs.promises.readFile(metaPath)).toString())
          };
        }
      )
    );
  }

  readMetaData(datasetPath: string): SuperviselyMeta {
    const META_FILE = path.join(datasetPath, "meta.json");
    return JSON.parse(fs.readFileSync(META_FILE).toString());
  }

  async create(id: string, name: string, stream: fs.ReadStream): Promise<string> {
    const extractPath = `${DATASET_DIR}/${id}-${name.replace(/\..*$/, "")}`;
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

    return extractPath;
  }
}
