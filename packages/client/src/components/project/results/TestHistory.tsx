import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography
} from "@material-ui/core";
import { gql, useQuery } from "@apollo/client";
import { QueryTestjobs } from "./__generated__/QueryTestjobs";
import { GetTests } from "./__generated__/GetTests";
import React from "react";
import { CloudDownload } from "@material-ui/icons";

const GET_TESTS = gql`
  query GetTests($id: ID!) {
    export(id: $id) {
      tests {
        name
        downloadPath
      }
    }
  }
`;

function TestList(props: { exprtID: string }): React.ReactElement {
  const { data, loading, error } = useQuery<GetTests>(GET_TESTS, {
    variables: { id: props.exprtID },
    pollInterval: 1000
  });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined || data.export === undefined) return <p>NO DATA</p>;
  if (data.export?.tests?.length === 0) return <Typography> Nothing here yet. </Typography>;
  return (
    <List style={{ minWidth: 400 }}>
      {data.export?.tests?.map((test) => (
        <ListItem>
          <a download href={`http://localhost:4000/${test.downloadPath}`}>
            <ListItemIcon>
              <CloudDownload />
            </ListItemIcon>
          </a>
          <ListItemText>{test.name}</ListItemText>
        </ListItem>
      ))}
    </List>
  );
}

export default function TestHistory(props: { exprtID: string; handler: () => void }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <MenuItem onClick={handleClick}>
        <Typography variant={"body1"}>Test History</Typography>
      </MenuItem>
      <Dialog onClose={handleClose} open={open}>
        <DialogContent dividers>
          <Typography> Tests: </Typography>
          <FilteredTestjobs exprtID={props.exprtID} />
          <TestList exprtID={props.exprtID} />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const GET_TESTJOBS = gql`
  query QueryTestjobs {
    testjobs {
      name
      exportID
      streamPort
    }
  }
`;

function FilteredTestjobs(props: { exprtID: string }): React.ReactElement {
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
          <ListItemText primary={`Test "${job.name}" in progress...`} />
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
