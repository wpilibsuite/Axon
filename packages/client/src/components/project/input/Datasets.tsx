import React, { ReactElement } from "react";
import Section from "../Section";
import gql from "graphql-tag";
import { createStyles, GridList, GridListTile, Theme } from "@material-ui/core";
import { DatasetCard } from "./DatasetCard";
import { makeStyles } from "@material-ui/core/styles";
import { GetDatasets } from "./__generated__/GetDatasets";
import { useQuery } from "@apollo/client";

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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-around",
      overflow: "hidden"
    },
    gridList: {
      flexWrap: "nowrap",
      // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
      transform: "translateZ(0)"
    }
  })
);

function DatasetSelectionGridList(props: { id: string }) {
  const classes = useStyles();
  const { data, loading, error } = useQuery<GetDatasets, GetDatasets>(GET_DATASETS);

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <div className={classes.root}>
      <GridList className={classes.gridList} spacing={5} cols={0}>
        {data.datasets.map((dataset) => (
          <GridListTile key={dataset.id} cols={1} style={{ height: "auto" }}>
            <DatasetCard projectId={props.id} dataset={dataset} />
          </GridListTile>
        ))}
      </GridList>
    </div>
  );
}

export default function Projects(props: { id: string }): ReactElement {
  return (
    <Section title="Projects">
      <DatasetSelectionGridList id={props.id} />
    </Section>
  );
}
