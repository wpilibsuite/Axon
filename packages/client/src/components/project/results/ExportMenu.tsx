import { Button, Grid, IconButton, Menu, MenuItem, Typography } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import React from "react";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import RenameExportButton from "./RenameExportButton";
import DeleteExportButton from "./DeleteExportButton";
import TestWindow from "./TestWindow";

export default function ExportMenu(props: {
  exprt: GetProjectData_project_exports | undefined;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
}): JSX.Element {
  if (props.exprt === undefined) {
    return (
      <Grid container spacing={3}>
        <Grid item>
          <Button variant={"contained"} disabled>
            Download
          </Button>
        </Grid>
        <Grid item>
          <Button variant={"contained"} disabled>
            Test
          </Button>
        </Grid>
        <Grid item>
          <Button variant={"contained"} disabled>
            Rename
          </Button>
        </Grid>
        <Grid item>
          <Button variant={"contained"} disabled>
            Delete
          </Button>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item>
        <TestWindow exprt={props.exprt} />
      </Grid>
      <Grid item>
        <a
          download
          href={`http://localhost:4000/${props.exprt.downloadPath}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <Button variant={"contained"}>Download</Button>
        </a>
      </Grid>
      <Grid item>
        <RenameExportButton id={props.exprt.id} />
      </Grid>
      <Grid item>
        <DeleteExportButton id={props.exprt.id} name={props.exprt.name} />
      </Grid>
    </Grid>
  );
}
