import { GetProjectData, GetProjectDataVariables } from "./__generated__/GetProjectData";
import { Grid, Typography } from "@material-ui/core";
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
  },
  heading: {
    display: "flex",
    justifyContent: "center"
  }
}));

const GET_PROJECT_DATA = gql`
  query GetProjectData($id: ID!) {
    project(id: $id) {
      id
      name
      datasets {
        name
      }
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
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <div className={classes.heading}>
              <Typography align={"center"} variant={"h2"} style={{ display: "inline-block" }}>
                {data.project.name}
              </Typography>
              <ProjectMenu project={data.project} />
            </div>
          </Grid>
          <Grid item xs={12}>
            <Input id={props.id} datasets={data.project.datasets} />
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
