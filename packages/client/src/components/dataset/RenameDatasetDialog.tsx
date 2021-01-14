import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography
} from "@material-ui/core";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";

const RENAME_DATASET_MUTATION = gql`
  mutation RenameDataset($id: ID!, $newName: String!) {
    renameDataset(id: $id, newName: $newName) {
      id
      name
    }
  }
`;

export default function RenameDatasetDialogButton(props: { id: string; handler: () => void }): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [renameDataset] = useMutation(RENAME_DATASET_MUTATION);

  const handleClickOpen = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleRename = () => {
    renameDataset({ variables: { id: props.id, newName } }).then(() => handleClose());
  };

  return (
    <>
      <MenuItem onClick={handleClickOpen}>
        <Typography variant={"body1"}>Rename</Typography>
      </MenuItem>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Rename Dataset</DialogTitle>
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
    </>
  );
}
