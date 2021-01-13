import React, { ReactElement } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@material-ui/core";
import gql from "graphql-tag";
import { GetDataset_dataset } from "./__generated__/GetDataset";

const DELETE_DATASET_MUTATION = gql`
  mutation DeleteDataset($id: ID!) {
    deleteDataset(id: $id) {
      id
    }
  }
`;

export default function DeleteDatasetDialogButton(props: { dataset: GetDataset_dataset }): ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);
  const [confirmation, setConfirmation] = React.useState<string>("");
  const [deleteDataset] = useMutation(DELETE_DATASET_MUTATION);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = () => {
    if (confirmation === props.dataset.name) {
      deleteDataset({ variables: { id: props.dataset.id } }).then(() => {
        apolloClient.resetStore().then(() => {
          window.location.href = "/about";
          console.log("deleted");
        });
      });
      handleClose();
    }
  };

  return (
    <>
      <Button onClick={handleClickOpen}>Delete</Button>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Confirm Dataset Deletion</DialogTitle>
        <DialogContent dividers>
          <p> Please confirm dataset deletion by typing &ldquo;{props.dataset.name}&rdquo; </p>
          <TextField onChange={(event) => setConfirmation(event.target.value)} autoFocus margin="dense" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleDelete} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
