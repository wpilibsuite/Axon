import React from "react";
import gql from "graphql-tag";
import { GetDatasets } from "./__generated__/GetDatasets";
import { useQuery } from "@apollo/react-hooks";
import { GridList, GridListTile, ListSubheader } from "@material-ui/core";
import DatasetCard from "./DatasetCard";

const GET_DATASETS = gql`
  query GetDatasets {
    datasets {
      id
      name
      images {
        path
      }
    }
  }
`;

export default function DatasetSelectionGridList() {
  const { data, loading, error } = useQuery<GetDatasets, GetDatasets>(GET_DATASETS);

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <GridList>
      {data.datasets.map((dataset) => (
        <GridListTile key={dataset.id} style={{ height: "auto" }}>
          <DatasetCard dataset={dataset} />
        </GridListTile>
      ))}
    </GridList>
  );
}
