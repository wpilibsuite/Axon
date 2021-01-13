import { IconButton, Menu, MenuItem } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import React, { ReactElement } from "react";
import { GetProjectData_project } from "./__generated__/GetProjectData";
import { makeStyles } from "@material-ui/core/styles";
import DeleteProjectDialogButton from "./DeleteDatasetDialog";
import RenameProjectDialog from "./RenameDatasetDialog";

const useStyles = makeStyles((theme) => ({
  largeIcon: {
    width: 40,
    height: 40
  }
}));

export default function ProjectMenu(props: { project: GetProjectData_project }): ReactElement {
  const classes = useStyles();
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
        <MoreVertIcon className={classes.largeIcon} />
      </IconButton>
      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleClose}>
          <RenameProjectDialog id={props.project.id} />
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <DeleteProjectDialogButton project={props.project} />
        </MenuItem>
      </Menu>
    </>
  );
}
