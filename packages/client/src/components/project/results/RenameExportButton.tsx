import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@material-ui/core";
import { useApolloClient, useMutation } from "@apollo/client";
import React, { ReactElement } from "react";
import gql from "graphql-tag";

const RENAME_EXPORT_MUTATION = gql`
  mutation RenameExport($id: ID!, $newName: String!) {
    renameExport(id: $id, newName: $newName) {
      id
      name
    }
  }
`;

export default function RenameExportButton(props: { id: string }): ReactElement {
  const [renameExport] = useMutation(RENAME_EXPORT_MUTATION);
  const [newName, setNewName] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleRename = async () => {
    renameExport({ variables: { id: props.id, newName } });
    await apolloClient.resetStore();
    handleClose();
  };

  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen}>
        Rename
      </Button>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Rename Export</DialogTitle>
        <DialogContent dividers>
          <TextField
            onChange={(event) => setNewName(event.target.value)}
            autoFocus
            margin="dense"
            label="New Name"
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
