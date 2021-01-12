import { GetProjectData, GetProjectDataVariables } from "./__generated__/GetProjectData";
import { Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { gql, useQuery } from "@apollo/client";
import React, { ReactElement } from "react";
import Metrics from "./metrics/Metrics";
import Results from "./results/Results";
import Input from "./input/Input";
import Datasets from "./input/Datasets";
import ProjectMenu from "./ProjectMenu";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary
  }
}));

const GET_PROJECT_DATA = gql`
  query GetProjectData($id: ID!) {
    project(id: $id) {
      id
      name
      checkpoints {
        id
        name
        step
        precision
      }
      exports {
        id
        projectID
        checkpointID
        name
        directory
        downloadPath
      }
      videos {
        id
        name
        filename
        fullPath
      }
    }
  }
`;

export default function Project(props: { id: string }): ReactElement {
  const classes = useStyles();

  const { data, loading, error } = useQuery<GetProjectData, GetProjectDataVariables>(GET_PROJECT_DATA, {
    variables: {
      id: props.id
    },
    pollInterval: 3000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;

  if (data?.project) {
    return (
      <div className={classes.root}>
        <Grid container spacing={3} alignItems={"center"} justify={"center"}>
          <Grid item xs={10}>
            <Typography align={"center"} variant={"h2"}>{data.project.name}</Typography>
          </Grid>
          <Grid item xs={2}>
            <ProjectMenu project={data.project} />
          </Grid>
          <Grid item xs={9}>
            <Datasets id={props.id} />
          </Grid>
          <Grid item xs={12}>
            <Input id={props.id} />
          </Grid>
          <Grid item xs={9}>
            <Metrics id={props.id} checkpoints={data.project.checkpoints} exports={data.project.exports} />
          </Grid>
          <Grid item xs={12}>
            <Results id={props.id} exports={data.project.exports} videos={data.project.videos} />
          </Grid>
        </Grid>
      </div>
    );
  } else {
    return <p> Error: cannot retrieve project data from server </p>;
  }
}
