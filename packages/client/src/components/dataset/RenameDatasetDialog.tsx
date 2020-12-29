import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton, MenuItem,
  TextField,
  Tooltip
} from "@material-ui/core";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";

const RENAME_DATASET_MUTATION = gql`
  mutation RenameDataset($id: ID!, $newName: String!) {
    renameDataset(id: $id, newName: $newName) {
        id
        name
    }
  }
`;

export default function RenameDatasetDialog(props: { id: string }): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [renameDataset] = useMutation(RENAME_DATASET_MUTATION);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleRename = () => {
    renameDataset({ variables: { id: props.id, newName } });
    handleClose();
  };

  return (
    <MenuItem onClick={handleClickOpen}>
      Rename
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Rename Datset</DialogTitle>
        <DialogContent dividers>
          <TextField
            onChange={(event) => setNewName(event.target.value)}
            autoFocus
            margin="dense"
            label="New Dataset Name"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleRename} color="primary">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </MenuItem>
  );
}
