import React from "react";
import gql from "graphql-tag";
import { Grid, Paper } from "@material-ui/core";
import Dataset from "../datasets/Dataset";
import AddDatasetButton from "../datasets/AddDatasetButton";

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

export default function DatasetSelectionPaper() {
  return (
    <Grid container spacing={2}>
      {datasets.map((dataset) => (
        <Grid key={dataset.name} item xs={12}>
          <Dataset dataset={dataset} />
        </Grid>
      ))}
      <Grid item xs={12}>
        <Paper>
          <AddDatasetButton />
        </Paper>
      </Grid>
    </Grid>
  );
}
