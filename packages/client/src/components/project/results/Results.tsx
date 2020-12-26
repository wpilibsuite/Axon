import {
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Typography,
  Card,
  Button
} from "@material-ui/core";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

import React, { ReactElement } from "react";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import StreamViewer from "./StreamViewer";
import TestButton from "./TestButton";

export default function Results(props: {
  id: string;
  exports: GetProjectData_project_exports[];
  videos: GetProjectData_project_videos[];
}): ReactElement {
  return (
    <Container>
      <Typography>Exported Models</Typography>
      <List>
        {props.exports.map((exprt) => (
          <Card key={exprt.name} variant="outlined">
            <ExportInfo exprt={exprt} videos={props.videos} />
          </Card>
        ))}
      </List>
    </Container>
  );
}

function ExportInfo(props: {
  exprt: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
}): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [streaming, setStreaming] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(!open);
  };
  const handleClickView = () => {
    setStreaming(!streaming);
  };

  return (
    <>
      <ListItem button onClick={handleClickOpen}>
        <ListItemText primary={props.exprt.name} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <TestButton modelExport={props.exprt} videos={props.videos} />
        <a download href={`http://localhost:4000/${props.exprt.downloadPath}`}>
          <IconButton>Download</IconButton>
        </a>
        <Collapse in={streaming} timeout="auto" unmountOnExit>
          <StreamViewer />
        </Collapse>
        <Button variant="outlined" color="secondary" onClick={handleClickView}>
          {streaming ? "Close" : "View"}
        </Button>
      </Collapse>
    </>
  );
}
