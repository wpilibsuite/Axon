import { Button, Grid } from "@material-ui/core";
import React from "react";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import TestWindow from "./TestWindow";

export default function ExportButtons(props: {
  exprt: GetProjectData_project_exports | undefined;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
}): JSX.Element {
  if (props.exprt === undefined) {
    return (
      <Grid container spacing={3}>
        <Grid item>
          <Button variant={"contained"} disabled>
            Test
          </Button>
        </Grid>
        <Grid item>
          <Button variant={"contained"} disabled>
            Download
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
    </Grid>
  );
}
