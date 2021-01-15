import { IconButton, Menu, MenuItem, Typography } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import React from "react";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import RenameExportButton from "./RenameExportButton";
import TestWindow from "./TestWindow";

export default function ExportMenu(props: {
  exprt: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
}): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
        <TestWindow exprt={props.exprt} handler={handleClose} />
      </Menu>
    </>
  );
}
