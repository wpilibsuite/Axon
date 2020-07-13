import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import Datasets from "../datasets";
import Training from "../training";

export default function SingleView(): ReactElement {
  return (
    <Grid container spacing={3}>
      <Grid item xs={4}>
        <Datasets />
      </Grid>
      <Grid item xs={2}>
        <Training />
      </Grid>
    </Grid>
  );
}
