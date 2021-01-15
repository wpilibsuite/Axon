import { IconButton, Menu, MenuItem, Tooltip, Typography } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import React from "react";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import ViewButton from "./ViewButton";
import TestButton from "./TestButton";
import RenameExportButton from "./RenameExportButton";
import TestWindow from "./TestWindow";

export default function ExportMenu(props: {
  exprt: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
}): JSX.Element {
  const job = props.jobs.find((job) => job.exportID === props.exprt.id);
  const active = job !== undefined;

  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  let viewButton = null;
  if (active) {
    viewButton = <ViewButton handler={handleClose} />;
  } else {
    viewButton = (
      <Tooltip title={"Test an exported model to view stream"}>
        <span>
          <MenuItem disabled>
            <Typography variant="body1" style={{ color: "#919191" }}>
              View
            </Typography>
          </MenuItem>
        </span>
      </Tooltip>
    );
  }

  let testButton = null;
  if (!active) {
    testButton = <TestButton modelExport={props.exprt} videos={props.videos} handler={handleClose} />;
  } else {
    testButton = (
      <Tooltip title={"Test is running"}>
        <span>
          <MenuItem disabled>
            <Typography variant="body1" style={{ color: "#919191" }}>
              Test
            </Typography>
          </MenuItem>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleClose}>
          <a
            download
            href={`http://localhost:4000/${props.exprt.downloadPath}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <Typography variant={"body1"}>Download</Typography>
          </a>
        </MenuItem>
        <RenameExportButton id={props.exprt.id} handler={handleClose} />
        {testButton}
        {viewButton}
        <TestWindow exprt={props.exprt} handler={handleClose} />
      </Menu>
    </>
  );
}
