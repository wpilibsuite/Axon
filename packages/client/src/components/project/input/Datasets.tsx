import { GetProjectData_project_dataset } from "../__generated__/GetProjectData";
import { GetDatasets } from "./__generated__/GetDatasets";
import { createStyles, TextField, Theme } from "@material-ui/core";
import React, { ReactElement } from "react";
import { DatasetCard } from "./DatasetCard";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { makeStyles } from "@material-ui/core/styles";

export const GET_DATASETS = gql`
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: "25ch"
    }
  })
);

export default function Datasets(props: { id: string; selected: GetProjectData_project_dataset | null }): ReactElement {
  const classes = useStyles();

  const { data, loading, error } = useQuery<GetDatasets, GetDatasets>(GET_DATASETS);

  let datasetName = "Dataset";
  if (props.selected != null) {
    datasetName = props.selected.name;
  }

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  /* the function for showing selected datasets inside the input */
  function renderFunc(selected: unknown) {
    return <div>{datasetName}</div>;
  }

  return (
    <TextField
      className={classes.root}
      select
      margin={"normal"}
      label="Datasets"
      variant="outlined"
      value={datasetName}
      SelectProps={{
        multiple: false,
        renderValue: renderFunc
      }}
    >
      {data.datasets.map((dataset) => (
        <DatasetCard projectId={props.id} dataset={dataset} key={dataset.id} />
      ))}
    </TextField>
  );
}
