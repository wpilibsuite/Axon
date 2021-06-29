import React, { ReactElement } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@material-ui/core";

type ResetProps = {
  callback: () => void
}

export default function ResetDockerButton(props: ResetProps): ReactElement {
  const [open, setOpen] = React.useState(false);
  const handleConfirm = () => {
    setOpen(false);
    props.callback();
  }

  return (
    <div>
      <Dialog open={open}>
        <DialogTitle>Hard reset confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Please confirm that you are intending to remove all of your data stored in Axon. You will lose all of your datasets, projects, videos, and exports. This action is unreversable.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant={"contained"} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant={"contained"} color={"primary"} onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Button variant={"contained"} onClick={() => setOpen(true)}>
        Reset User Data
      </Button>
    </div>
  );
}