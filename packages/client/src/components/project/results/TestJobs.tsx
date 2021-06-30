import { Box, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { QueryTestjobs, QueryTestjobs_testjobs } from "./__generated__/QueryTestjobs";
import { gql, useMutation, useQuery } from "@apollo/client";
import React, { useState } from "react";
type Testjob = QueryTestjobs_testjobs;

const GET_TESTJOBS = gql`
  query QueryTestjobs {
    testjobs {
      name
      testID
      exportID
      streamPort
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
    <List dense={true}>
      {thisExportsTestjobs.map((job) => (
        <ListItem key={job.exportID}>
          <ListItemIcon>
            <CircularProgress />
          </ListItemIcon>
          <ListItemText style={{ marginRight: "20px" }} primary={job.name} />
          <a
            href={`http://localhost:${job.streamPort}/stream.mjpg`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "none"
            }}
          >
            <Button variant="contained" color="primary">
              View
            </Button>
          </a>
          <Box ml={1}>
            <Button variant="outlined" onClick={() => handleStop(job.testID)}>
              Cancel
            </Button>
          </Box>
        </ListItem>
      ))}
    </List>
  );
}
