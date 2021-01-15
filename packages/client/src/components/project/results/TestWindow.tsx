import { Button, Dialog, DialogActions, DialogContent, MenuItem, Typography } from "@material-ui/core";
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";
import TestInput from "./TestInput";
import TestList from "./TestList";
import Testjobs from "./Testjobs";
import React from "react";
type Export = GetProjectData_project_exports;

export default function TestWindow(props: { exprt: Export; handler: () => void }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };

  /* until there is support for multiple tests at once, we gotta do (something like) this */
  const [active, setActive] = React.useState(false);
  const handleCompleted = () => {
    setActive(false);
  };

  return (
    <>
      <MenuItem onClick={handleClick}>
        <Typography variant={"body1"}>Test</Typography>
      </MenuItem>
      <Dialog onClose={handleClose} open={open}>
        <DialogContent dividers>
          <Typography variant="h4" style={{ display: "flex", justifyContent: "center" }}>
            Testing
          </Typography>
          <TestInput exprt={props.exprt} active={active} setActive={setActive} />
          <Testjobs exprtID={props.exprt.id} onComplete={handleCompleted} />
          <TestList exprtID={props.exprt.id} />
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
