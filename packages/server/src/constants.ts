import * as mkdirp from "mkdirp";
import * as path from "path";

export const DATA_DIR = "data";
export const DATASET_DATA_DIR = path.join(DATA_DIR, "datasets");
export const PROJECT_DATA_DIR = path.join(DATA_DIR, "projects");

mkdirp.sync(DATA_DIR);
mkdirp.sync(DATASET_DATA_DIR);
mkdirp.sync(PROJECT_DATA_DIR);
