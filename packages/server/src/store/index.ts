import { DataTypes, Model, Optional, Sequelize } from "sequelize";
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

  epochs: number;
  batchSize: number;
  evalFrequency: number;
  percentEval: number;

  inProgress: boolean;
}

type ProjectCreationAttributes = Optional<ProjectAttributes, keyof ProjectAttributes>;

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  name: string;
  epochs: number;
  batchSize: number;
  evalFrequency: number;
  percentEval: number;
  inProgress: boolean;

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
    epochs: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 10
    },
    batchSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 16
    },
    evalFrequency: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1
    },
    percentEval: {
      type: DataTypes.FLOAT,
      defaultValue: 0.9
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

sequelize.sync({ force: false });
