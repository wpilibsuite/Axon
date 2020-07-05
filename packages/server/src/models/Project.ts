import { BuildOptions, DataTypes, Model, STRING, UUID, UUIDV1 } from "sequelize";

import sequelize from "../db";

class Project extends Model {
  public id: string;
  public title: string;
  public content: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: UUID,
      defaultValue: UUIDV1,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "project",
    timestamps: true
  }
);

export type ProjectModelStatic = typeof Model & {
  new (values?: Record<string, unknown>, options?: BuildOptions): Project;
};

export default Project as ProjectModelStatic;
