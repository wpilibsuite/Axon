import { Context } from "../context";
import { Dataset } from "../schema/__generated__/graphql";

export const DatasetModel = {
  all({ low }: Context): Dataset[] {
    return low.connection.get("datasets").value();
  },
  findById(id: string, { low }: Context): Dataset {
    return low.connection.get("datasets").find({ id: id }).value();
  }
};
