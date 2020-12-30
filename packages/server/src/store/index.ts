import {
  Association,
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManySetAssociationsMixin,
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

interface ProjectAttributes {
  id: string;
  name: string;
  initialCheckpoint: string;

  epochs: number;
  batchSize: number;
  evalFrequency: number;
  percentEval: number;

  inProgress: boolean;
}

type ProjectCreationAttributes = Optional<ProjectAttributes, keyof ProjectAttributes>;

interface CheckpointAttributes {
  id: string;
  name: string;
  step: number;
  path: string;
  precision: number;
}

type CheckpointCreationAttributes = Optional<CheckpointAttributes, keyof CheckpointAttributes>;

export class Checkpoint extends Model<CheckpointAttributes, CheckpointCreationAttributes>
  implements CheckpointAttributes {
  public name: string;
  public step: number;
  public path: string;
  public precision: number;

  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  name: string;
  initialCheckpoint: string;

  epochs: number;
  batchSize: number;
  evalFrequency: number;
  percentEval: number;

  inProgress: boolean;

  public getDatasets!: HasManyGetAssociationsMixin<Dataset>;
  public setDatasets!: HasManySetAssociationsMixin<Dataset, string>;
  public addDataset!: HasManyAddAssociationMixin<Dataset, string>;
  public removeDataset!: HasManyRemoveAssociationMixin<Dataset, string>;

  public getCheckpoints!: HasManyGetAssociationsMixin<Checkpoint>;
  public setCheckpoints!: HasManySetAssociationsMixin<Checkpoint, string>;
  public addCheckpoint!: HasManyAddAssociationMixin<Checkpoint, string>;
  public removeCheckpoint!: HasManyRemoveAssociationMixin<Checkpoint, string>;

  public readonly id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    checkpoints: Association<Project, Checkpoint>;
    datasets: Association<Project, Dataset>;
  };
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
    path: {
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
      defaultValue: 50
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

Project.belongsToMany(Dataset, { through: "DatasetProject" });
Dataset.belongsToMany(Project, { through: "DatasetProject" });

Project.belongsToMany(Checkpoint, { through: "ProjectCheckpoint" });

sequelize.sync({ force: false });
