import { Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { QueryTestjobs } from "./__generated__/QueryTestjobs";
import { gql, useQuery } from "@apollo/client";
import React from "react";

const GET_TESTJOBS = gql`
  query QueryTestjobs {
    testjobs {
      name
      exportID
      streamPort
    }
  }
`;

export default function Testjobs(props: { exprtID: string }): React.ReactElement {
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
          <a href={`http://localhost:${job.streamPort}/stream.mjpg`} target="_blank" rel="noopener noreferrer">
            <Button variant="outlined" color={"secondary"}>
              View
            </Button>
          </a>
        </ListItem>
      ))}
    </List>
  );
}
