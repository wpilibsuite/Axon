import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography
} from "@material-ui/core";
import { DeleteForever } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import * as Dockerode from "dockerode";

const useStyles = makeStyles((theme) => ({
  trash: {
    height: 40,
    width: 40
  }
}));

type ResetProps = {
  callback: () => void;
  docker: Dockerode;
};

export default function ResetDockerButton(props: ResetProps): ReactElement {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleConfirm = () => {
    setOpen(false);
    props.callback();
  };

  return (
    <div>
      <Dialog open={open}>
        <DialogTitle>Hard reset confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Please confirm that you are intending to remove all of your data stored in Axon. You will lose all of your
            datasets, projects, videos, and exports. This action is unreversable.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant={"contained"} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant={"contained"} color={"primary"} onClick={handleConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Tooltip title={"Delete all user data"}>
        <IconButton onClick={() => setOpen(true)}>
          <DeleteForever className={classes.trash} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
