import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import Training from "../training";
import DatasetSelectionGridList from "./DatasetSelectionGridList";

export default function SingleView(): ReactElement {
  return (
    <Grid container spacing={3}>
      <Grid item xs={3}>
        <DatasetSelectionGridList />
      </Grid>
      <Grid item xs={2}>
        <Training />
      </Grid>
    </Grid>
  );
}
