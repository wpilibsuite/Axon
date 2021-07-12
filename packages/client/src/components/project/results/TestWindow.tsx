import { Button, Dialog, DialogActions, DialogContent, Typography } from "@material-ui/core";
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";
import TestInput from "./TestInput";
import TestList from "./TestList";
import TestJobs from "./TestJobs";
import React from "react";
type Export = GetProjectData_project_exports;

export default function TestWindow(props: { exprt: Export }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(true);
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
      <Button variant={"contained"} onClick={handleClick}>
        Test
      </Button>
      <Dialog onClose={handleClose} open={open}>
        <DialogContent dividers>
          <Typography variant="h4" style={{ display: "flex", justifyContent: "center" }}>
            Testing
          </Typography>
          <Typography variant="h6" style={{ display: "flex", justifyContent: "center", paddingBottom: "15px" }}>
            {`Model: ${props.exprt.name}`}
          </Typography>
          <TestInput exprt={props.exprt} active={active} setActive={setActive} />
          <TestJobs exprtID={props.exprt.id} onComplete={handleCompleted} />
          <TestList exprtID={props.exprt.id} />
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant={"contained"} onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
