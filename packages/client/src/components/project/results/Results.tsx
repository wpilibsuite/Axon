import {
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Typography,
  Card,
  Button,
  DialogActions,
  Dialog,
  DialogContent
} from "@material-ui/core";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { gql, useQuery } from "@apollo/client";
import React, { ReactElement } from "react";
import StreamViewer from "./StreamViewer";
import TestButton from "./TestButton";

const GET_TESTJOBS = gql`
  query GetTestjobs {
    testjobs {
      testID
      exportID
      projectID
      streamPort
    }
  }
`;

export default function Results(props: {
  id: string;
  exports: GetProjectData_project_exports[];
  videos: GetProjectData_project_videos[];
}): ReactElement {
  const { data, loading, error } = useQuery(GET_TESTJOBS, {
    pollInterval: 2000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  return (
    <Container>
      <Typography>Exported Models</Typography>
      <List>
        {props.exports.map((exprt) => (
          <Card key={exprt.name} variant="outlined">
            <ExportInfo exprt={exprt} videos={props.videos} jobs={data.testjobs} />
          </Card>
        ))}
      </List>
    </Container>
  );
}

function ExportInfo(props: {
  exprt: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
}): JSX.Element {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(!open);
  };

  const job = props.jobs.find((job) => job.exportID === props.exprt.id);
  const active = job !== undefined;
  const port = job ? job.streamPort : "0000";

  return (
    <>
      <ListItem button onClick={handleClickOpen}>
        <ListItemText primary={props.exprt.name} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <ActiveTestView active={active} port={port} />
        <TestButton active={active} modelExport={props.exprt} videos={props.videos} />
        <a download href={`http://localhost:4000/${props.exprt.downloadPath}`}>
          <IconButton>Download</IconButton>
        </a>
      </Collapse>
    </>
  );
}

function ActiveTestView(props: { active: boolean; port: string }): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const handleClickView = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Collapse in={props.active} timeout="auto" unmountOnExit>
        <Button variant="outlined" color="secondary" onClick={handleClickView}>
          View
        </Button>
        <Dialog onClose={handleClose} open={open} style={{ display: "block" }} maxWidth={false}>
          <DialogContent dividers>
            <StreamViewer port={props.port} />
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose}>
              Close
            </Button>
            <Button autoFocus color="primary">
              Stop
            </Button>
          </DialogActions>
        </Dialog>
      </Collapse>
    </>
  );
}
