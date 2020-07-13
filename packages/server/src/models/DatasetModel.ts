import { Context } from "../context";
import { Dataset } from "../schema/__generated__/graphql";
import * as shortid from "shortid";
import { createWriteStream, unlink } from "fs";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

const UPLOAD_DIR = "uploads";
mkdirp.sync(UPLOAD_DIR);

export const DatasetModel = {
  all({ low }: Context): Dataset[] {
    return low.connection.get("datasets").value();
  },
  findById(id: string, { low }: Context): Dataset {
    return low.connection.get("datasets").find({ id: id }).value();
  },
  async create(filename: string, stream: fs.ReadStream, { low }: Context): Promise<Dataset> {
    const id = shortid.generate();
    const path = `${UPLOAD_DIR}/${id}-${filename}`;
    const dateAdded = new Date();
    const dataset: Dataset = { id, dateAdded, name: filename, path };

    // Store the file in the filesystem.
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(path);
      writeStream.on("finish", resolve);
      writeStream.on("error", (error) => {
        unlink(path, () => {
          reject(error);
        });
      });
      stream.on("error", (error) => writeStream.destroy(error));
      stream.pipe(writeStream);
    });

    low.connection.get("datasets").push(dataset).write();
    return dataset;
  }
};
