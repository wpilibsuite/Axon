import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@material-ui/core";
import { useApolloClient, useMutation } from "@apollo/client";
import DeleteIcon from "@material-ui/icons/Delete";
import React, { ReactElement } from "react";
import gql from "graphql-tag";

// const DELETE_TEST_MUTATION = gql`
//   mutation DeleteTest($id: ID!) {
//     deleteTest(id: $id) {
//       id
//     }
//   }
// `;

export default function DeleteTestButton(props: { id: string; name: string }): ReactElement {
  //   const [deleteTest] = useMutation(DELETE_TEST_MUTATION);
  const [deleting, setDeleting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = async () => {
    setDeleting(true);
    handleClose();
    // deleteTest({ variables: { id: props.id } }).then(() => apolloClient.resetStore().then(() => handleClose()));
  };

  return (
    <>
      <IconButton onClick={handleClickOpen}>
        <DeleteIcon />
      </IconButton>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Delete Test</DialogTitle>
        <DialogContent dividers>
          <Typography>{`Are you sure you want to delete ${props.name}?`}</Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleDelete} disabled={deleting} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
