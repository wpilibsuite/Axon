import React, { ReactElement } from "react";
import { Grid, Paper } from "@material-ui/core";
import Dataset from "./Dataset";
import AddDatasetButton from "./AddDatasetButton";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { GetDatasets } from "./__generated__/GetDatasets";

// export interface IDataset {
//   name: string;
//   imageCount: number;
// }

// function randomDatasets(count: number) {
//   const datasets: IDataset[] = [];
//   for (let i = 0; i < count; i++) {
//     datasets.push({
//       name: `Dataset ${i}`,
//       imageCount: Math.floor(Math.random() * Math.floor(5000))
//     });
//   }
//   return datasets;
// }

// const datasets: IDataset[] = randomDatasets(5);

const GET_DATASETS = gql`
  query GetDatasets {
    datasets {
      id
      name
      images {
        path
        size {
          width
          height
        }
      }
    }
  }
`;

export default function Datasets(): ReactElement {
  const { data, loading, error } = useQuery<GetDatasets, GetDatasets>(GET_DATASETS);

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <Grid container spacing={2}>
      {data.datasets.map((dataset) => (
        <Grid key={dataset.name} item xs={12}>
          <Dataset name={dataset.name} images={dataset.images!} />
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
