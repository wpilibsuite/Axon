import {
  Box,
  Button,
  CircularProgress,
  createStyles,
  Grid,
  LinearProgress,
  Theme,
  Typography
} from "@material-ui/core";
import { QueryTestjobs, QueryTestjobs_testjobs } from "./__generated__/QueryTestjobs";
import { gql, useMutation, useQuery } from "@apollo/client";
import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";

type Testjob = QueryTestjobs_testjobs;
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    view: {
      color: "inherit",
      textDecoration: "none"
    },
    name: {
      marginRight: "20px"
    },
    item: {
      paddingTop: "10px"
    }
  })
);

const GET_TESTJOBS = gql`
  query QueryTestjobs {
    testjobs {
      name
      testID
      exportID
      streamPort
      percentDone
    }
  }
`;

const STOP_TEST = gql`
  mutation StopTest($id: ID!) {
    stopTesting(id: $id) {
      name
    }
  }
`;

export default function TestJobs(props: { exprtID: string; onComplete: (id: string) => void }): React.ReactElement {
  const [stopTest] = useMutation(STOP_TEST);
  const classes = useStyles();
  const handleStop = (id: string) => {
    stopTest({ variables: { id } }).catch((err) => {
      console.log(err);
    });
  };

  const [jobs, setJobs] = useState<Testjob[]>([]);
  const { data, loading, error } = useQuery<QueryTestjobs>(GET_TESTJOBS, {
    pollInterval: 1000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  if (data.testjobs.length < jobs.length)
    for (const job of jobs) if (!data.testjobs.includes(job)) props.onComplete(job.testID);

  if (data.testjobs.length !== jobs.length) setJobs(data.testjobs);

  const thisExportsTestjobs = data.testjobs.filter((job) => job.exportID === props.exprtID);

  return (
    <Grid container className={classes.item} spacing={3}>
      {thisExportsTestjobs.map((job) => (
        <Grid item xs={12} key={job.name}>
          <Grid container>
            <Grid item xs={3}>
              <CircularProgress />
            </Grid>
            <Grid item xs={3}>
              <Typography className={classes.name}>{job.name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <a
                href={`http://localhost:${job.streamPort}/stream.mjpg`}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.view}
              >
                <Button variant="contained" color="primary">
                  View
                </Button>
              </a>
            </Grid>
            <Grid item xs={3}>
              <Button variant="outlined" onClick={() => handleStop(job.testID)}>
                Cancel
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Box className={classes.item}>
                <LinearProgress variant="determinate" value={job.percentDone * 100} />
              </Box>
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
}
