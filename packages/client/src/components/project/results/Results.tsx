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
  ListItemIcon
} from "@material-ui/core";
import {
  GetProjectData_project_exports,
  GetProjectData_project_videos,
  GetProjectData_project_tests
} from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { gql, useQuery } from "@apollo/client";
import React, { ReactElement } from "react";
import StreamViewer from "./StreamViewer";
import TestButton from "./TestButton";
import * as path from "path";

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
  tests: GetProjectData_project_tests[];
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
            <ExportInfo exprt={exprt} videos={props.videos} tests={props.tests} jobs={data.testjobs} />
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
  tests: GetProjectData_project_tests[];
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
        <Card variant="outlined">
          <DownloadButton downloadPath={props.exprt.downloadPath} />
          <ActiveTestView active={active} port={port} />
          <TestButton active={active} modelExport={props.exprt} videos={props.videos} />
          <TestList tests={props.tests} exportID={props.exprt.id} />
        </Card>
      </Collapse>
    </>
  );
}

function DownloadButton(props: { downloadPath: string }): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <List dense={true}>
        <ListItem>
          <ListItemIcon>
            <IconButton>
              <a href={`http://localhost:4000/${props.downloadPath}`} download>
                <CloudDownloadIcon />
              </a>
            </IconButton>
          </ListItemIcon>
          <ListItemText primary={path.basename(props.downloadPath)} />
        </ListItem>
      </List>
    </div>
  );
}

function TestList(props: { tests: GetProjectData_project_tests[]; exportID: string }): JSX.Element {
  const exprtTests = props.tests.filter((test) => test.exportID === props.exportID);

  if (props.tests.length === 0) return <></>;

  return (
    <>
      <br />
      <Typography>Completed tests:</Typography>
      <List dense={true}>
        {exprtTests.map((test) => (
          <ListItem key={test.id}>
            <ListItemIcon>
              <IconButton>
                <a href={`http://localhost:4000/${test.downloadPath}`} download>
                  <CloudDownloadIcon fontSize="small" />
                </a>
              </IconButton>
            </ListItemIcon>
            <ListItemText primary={test.name} />
          </ListItem>
        ))}
      </List>
    </>
  );
}

function ActiveTestView(props: { active: boolean; port: string }): JSX.Element {
  const [streaming, setStreaming] = React.useState(false);
  const handleClickView = () => {
    setStreaming(!streaming);
  };

  const buttonColor = streaming ? "primary" : "secondary";

  return (
    <>
      <Collapse in={props.active} timeout="auto" unmountOnExit>
        <Button variant="outlined" color={buttonColor} onClick={handleClickView}>
          {streaming ? "Close" : "View"}
        </Button>
        <Collapse in={streaming} timeout="auto" unmountOnExit>
          <StreamViewer port={props.port} />
        </Collapse>
      </Collapse>
    </>
  );
}
