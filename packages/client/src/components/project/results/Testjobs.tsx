import { Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { QueryTestjobs } from "./__generated__/QueryTestjobs";
import { gql, useMutation, useQuery } from "@apollo/client";
import React from "react";

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

export default function Testjobs(props: { exprtID: string }): React.ReactElement {
  const [stopTest] = useMutation(STOP_TEST);
  const handleStop = (id: string) => {
    stopTest({ variables: { id } }).catch((err) => {
      console.log(err);
    });
  };

  const { data, loading, error } = useQuery<QueryTestjobs>(GET_TESTJOBS, {
    pollInterval: 1000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  const thisExportsTestjobs = data.testjobs.filter((job) => job.exportID === props.exprtID);

  return (
    <List dense={true}>
      {thisExportsTestjobs.map((job) => (
        <ListItem key={job.exportID}>
          <ListItemIcon>
            <CircularProgress />
          </ListItemIcon>
          <ListItemText primary={job.name} />
          <a
            href={`http://localhost:${job.streamPort}/stream.mjpg`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "none"
            }}
          >
            <Button variant="outlined" color={"secondary"}>
              View
            </Button>
          </a>
          <Button variant="outlined" onClick={() => handleStop(job.testID)}>
            Cancel
          </Button>
        </ListItem>
      ))}
    </List>
  );
}
