import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip
} from "@material-ui/core";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { GetProjectCheckpoints_project_checkpoints_status } from "./__generated__/GetProjectCheckpoints";

const about = `

This code is not being used right now. I dont want to delete it because we may want to have
a seperate button for exports inside the dialog that comes from clicking a checkpoint. In fact
this is almost definitly what we want to do, just not yet.


`;

const EXPORT_CHECKPOINT_BUTTON_MUTATION = gql`
  mutation exportCheckpointButton($id: ID!, $checkpointNumber: Int!, $name: String!) {
    exportCheckpoint(id: $id, checkpointNumber: $checkpointNumber, name: $name) {
      id
    }
  }
`;

export default function ExportButton(props: {
  id: string;
  ckptNumber: number;
  status: GetProjectCheckpoints_project_checkpoints_status;
}): ReactElement {
  const [exportCheckpoint] = useMutation(EXPORT_CHECKPOINT_BUTTON_MUTATION);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleExport = () => {
    const id = props.id;
    const checkpointNumber = props.ckptNumber;
    exportCheckpoint({ variables: { id, checkpointNumber, name } }).catch((err) => {
      console.log(err);
    });
    handleClose();
  };

  if (!props.status.exporting) {
    return (
      <>
        <Tooltip title="Export">
          <IconButton onClick={handleClickOpen}>Export</IconButton>
        </Tooltip>
        <Dialog onClose={handleClose} open={open}>
          <DialogTitle>Export Checkpoint</DialogTitle>
          <DialogContent dividers>
            <TextField
              onChange={(event) => setName(event.target.value)}
              autoFocus
              margin="dense"
              label="Model Name"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose}>
              Cancel
            </Button>
            <Button autoFocus onClick={handleExport} color="primary">
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  } else {
    return (
      <>
        <Tooltip title="Export">
          <IconButton>Exporting</IconButton>
        </Tooltip>
      </>
    );
  }
}
