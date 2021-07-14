import {
  Association,
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManySetAssociationsMixin,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
  Model,
  Optional,
  Sequelize
} from "sequelize";
import { DATA_DIR } from "../constants";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: `${DATA_DIR}/store.sqlite`,
  logging: false
});

interface DatasetAttributes {
  id: string;
  name: string;
  path: string;
}

type DatasetCreationAttributes = Optional<DatasetAttributes, keyof DatasetAttributes>;

export class Dataset extends Model<DatasetAttributes, DatasetCreationAttributes> implements DatasetAttributes {
  public name: string;
  public path: string;

  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

interface CheckpointAttributes {
  id: string;
  name: string;
  step: number;
  fullPath: string;
  precision: number;
  relativePath: string;
}

type CheckpointCreationAttributes = Optional<CheckpointAttributes, keyof CheckpointAttributes>;

export class Checkpoint extends Model<CheckpointAttributes, CheckpointCreationAttributes>
  implements CheckpointAttributes {
  public name: string;
  public step: number;
  public fullPath: string;
  public relativePath: string;
  public precision: number;

  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

interface ExportAttributes {
  relativeDirPath: string;
  downloadPath: string;
  checkpointID: string;
  tarfileName: string;
  directory: string;
  projectID: string;
  name: string;
  id: string;
  step: number;
  precision: number;
}

type ExportCreationAttributes = Optional<ExportAttributes, keyof ExportAttributes>;

export class Export extends Model<ExportAttributes, ExportCreationAttributes> implements ExportAttributes {
  public static associations: {
    tests: Association<Export, Test>;
  };
  relativeDirPath: string;
  downloadPath: string;
  checkpointID: string;
  tarfileName: string;
  projectID: string;
  directory: string;
  name: string;
  step: number;
  precision: number;
  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public getTests!: HasManyGetAssociationsMixin<Test>;
  public addTest!: HasManyAddAssociationMixin<Test, string>;
  public removeTest!: HasManyRemoveAssociationMixin<Test, string>;
}

interface VideoAttributes {
  id: string;
  name: string;
  filename: string;
  fullPath: string;
}

type VideoCreationAttributes = Optional<VideoAttributes, keyof VideoAttributes>;

export class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  name: string;
  filename: string;
  fullPath: string;

  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

interface TestAttributes {
  id: string;
  videoID: string;
  exportID: string;
  name: string;
  fullPath: string;
  directory: string;
  downloadPath: string;
  percentDone: number;
}

type TestCreationAttributes = Optional<TestAttributes, keyof TestAttributes>;

export class Test extends Model<TestAttributes, TestCreationAttributes> implements TestAttributes {
  videoID: string;
  exportID: string;
  name: string;
  fullPath: string;
  directory: string;
  downloadPath: string;
  percentDone: number;

  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

interface ProjectAttributes {
  id: string;
  name: string;
  directory: string;
  initialCheckpoint: string;

  epochs: number;
  batchSize: number;
  evalFrequency: number;
  percentEval: number;

  inProgress: boolean;
}

type ProjectCreationAttributes = Optional<ProjectAttributes, keyof ProjectAttributes>;

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public static associations: {
    checkpoints: Association<Project, Checkpoint>;
    dataset: Association<Project, Dataset>;
    exports: Association<Project, Export>;
  };
  name: string;
  directory: string;
  initialCheckpoint: string;
  epochs: number;
  batchSize: number;
  evalFrequency: number;
  percentEval: number;
  inProgress: boolean;
  public getDataset!: HasOneGetAssociationMixin<Dataset>;
  public setDataset!: HasOneSetAssociationMixin<Dataset, string>;
  public getCheckpoints!: HasManyGetAssociationsMixin<Checkpoint>;
  public setCheckpoints!: HasManySetAssociationsMixin<Checkpoint, string>;
  public addCheckpoint!: HasManyAddAssociationMixin<Checkpoint, string>;
  public removeCheckpoint!: HasManyRemoveAssociationMixin<Checkpoint, string>;
  public getExports!: HasManyGetAssociationsMixin<Export>;
  public addExport!: HasManyAddAssociationMixin<Export, string>;
  public removeExport!: HasManyRemoveAssociationMixin<Export, string>;
  public getVideos!: HasManyGetAssociationsMixin<Video>;
  public addVideo!: HasManyAddAssociationMixin<Video, string>;
  public removeVideo!: HasManyRemoveAssociationMixin<Video, string>;
  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Dataset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    path: {
      type: new DataTypes.STRING(),
      allowNull: true
    }
  },
  {
    sequelize
  }
);

Checkpoint.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    step: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    fullPath: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    relativePath: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    precision: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  },
  {
    sequelize
  }
);

Export.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    projectID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    checkpointID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    tarfileName: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    downloadPath: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    directory: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    relativeDirPath: {
      type: new DataTypes.STRING(),
      allowNull: true
    },
    step: {
      type: new DataTypes.INTEGER(),
      allowNull: false
    },
    precision: {
      type: new DataTypes.FLOAT(),
      allowNull: false
    }
  },

  {
    sequelize
  }
);

Video.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    filename: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    fullPath: {
      type: new DataTypes.STRING(),
      allowNull: false
    }
  },
  {
    sequelize
  }
);

Test.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    videoID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    exportID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    fullPath: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    directory: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    downloadPath: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    percentDone: {
      type: new DataTypes.FLOAT(),
      allowNull: false
    }
  },
  {
    sequelize
  }
);

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    directory: {
      type: new DataTypes.STRING(),
      allowNull: false
    },
    initialCheckpoint: {
      type: new DataTypes.STRING(),
      defaultValue: "default"
    },
    epochs: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 200
    },
    batchSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 16
    },
    evalFrequency: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 25
    },
    percentEval: {
      type: DataTypes.FLOAT,
      defaultValue: 30
    },
    inProgress: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize
  }
);

Project.belongsTo(Dataset);
Dataset.belongsToMany(Project, { through: "DatasetProject" });

Project.belongsToMany(Checkpoint, { through: "ProjectCheckpoint" });
Project.belongsToMany(Export, { through: "ProjectExport" });
Project.belongsToMany(Video, { through: "ProjectVideo" });
Export.belongsToMany(Test, { through: "ExportTest" });

sequelize.sync({ force: false });
