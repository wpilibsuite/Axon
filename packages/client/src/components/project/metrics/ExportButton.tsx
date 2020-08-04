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

const EXPORT_CHECKPOINT_MUTATION = gql`
  mutation exportCheckpoint($id: ID!, $checkpointNumber: Int!, $name: String!) {
    exportCheckpoint(id: $id, checkpointNumber: $checkpointNumber, name: $name) {
      id
    }
  }
`;

export default function ExportButton(props: { id: string; ckptNumber: number }): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [exportCheckpoint] = useMutation(EXPORT_CHECKPOINT_MUTATION);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleExport = () => {
    const id = props.id;
    const checkpointNumber = props.ckptNumber;
    console.log(id);
    console.log(checkpointNumber);
    console.log(name);
    exportCheckpoint({ variables: { id, checkpointNumber, name } }).catch((err) => {
      console.log(err);
    });
    handleClose();
  };

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
}
