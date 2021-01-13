import { GetProjectData_project_datasets } from "../__generated__/GetProjectData";
import { GetDatasets } from "./__generated__/GetDatasets";
import { TextField } from "@material-ui/core";
import React, { ReactElement } from "react";
import { DatasetCard } from "./DatasetCard";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";

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

export default function Datasets(props: { id: string; selected: GetProjectData_project_datasets[] }): ReactElement {
  const { data, loading, error } = useQuery<GetDatasets, GetDatasets>(GET_DATASETS);
  const datasetNames = props.selected.map((dataset) => dataset.name);

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  /* the function for showing selected datasets inside the input */
  function renderFunc(selected: unknown) {
    return <div>{datasetNames.join(", ")}</div>;
  }

  return (
    <TextField
      select
      margin={"normal"}
      label="Datasets"
      variant="outlined"
      value={datasetNames}
      SelectProps={{
        multiple: true,
        renderValue: renderFunc
      }}
    >
      {data.datasets.map((dataset) => (
        <DatasetCard projectId={props.id} dataset={dataset} key={dataset.id} />
      ))}
    </TextField>
  );
}
