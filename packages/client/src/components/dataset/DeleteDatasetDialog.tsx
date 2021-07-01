import React, { ReactElement } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Typography } from "@material-ui/core";
import gql from "graphql-tag";
import { GetDataset_dataset } from "./__generated__/GetDataset";

const DELETE_DATASET_MUTATION = gql`
  mutation DeleteDataset($id: ID!) {
    deleteDataset(id: $id) {
      id
    }
  }
`;

export default function DeleteDatasetDialogButton(props: {
  dataset: GetDataset_dataset;
  handler: () => void;
}): ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);
  const [deleteDataset] = useMutation(DELETE_DATASET_MUTATION);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = () => {
    deleteDataset({ variables: { id: props.dataset.id } }).then(() => {
      apolloClient.resetStore().then(() => {
        window.location.href = "/docs";
        handleClose();
      });
    });
  };

  return (
    <>
      <MenuItem onClick={handleClickOpen}>
        <Typography variant={"body1"}>Delete</Typography>
      </MenuItem>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Confirm Dataset Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to permanently delete dataset &ldquo;{props.dataset.name}&rdquo;? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant={"contained"} onClick={handleClose}>
            Cancel
          </Button>
          <Button variant={"contained"} onClick={handleDelete} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
