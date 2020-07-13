import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import Dataset from "./Dataset";

export interface IDataset {
  name: string;
  imageCount: number;
}

function randomDatasets(count: number) {
  const datasets: IDataset[] = [];
  for (let i = 0; i < count; i++) {
    datasets.push({
      name: `Dataset ${i}`,
      imageCount: Math.floor(Math.random() * Math.floor(5000))
    });
  }
  return datasets;
}

const datasets: IDataset[] = randomDatasets(5);

export default function Datasets(): ReactElement {
  return (
    <Grid container spacing={2}>
      {datasets.map((dataset) => (
        <Grid key={dataset.name} item xs={12}>
          <Dataset dataset={dataset} />
        </Grid>
      ))}
    </Grid>
  );
}
