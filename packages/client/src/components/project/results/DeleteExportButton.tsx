import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Typography } from "@material-ui/core";
import { useApolloClient, useMutation } from "@apollo/client";
import React, { ReactElement } from "react";
import gql from "graphql-tag";

const DELETE_EXPORT_MUTATION = gql`
  mutation DeleteExport($id: ID!) {
    deleteExport(id: $id) {
      id
    }
  }
`;

export default function DeleteExportButton(props: { id: string; name: string; handler: () => void }): ReactElement {
  const [deleteExport] = useMutation(DELETE_EXPORT_MUTATION);
  const [deleting, setDeleting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = async () => {
    setDeleting(true);
    deleteExport({ variables: { id: props.id } }).then(() => apolloClient.resetStore().then(() => handleClose()));
  };

  return (
    <>
      <MenuItem onClick={handleClickOpen}>
        <Typography variant={"body1"}>Delete</Typography>
      </MenuItem>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Delete Export</DialogTitle>
        <DialogContent dividers>
          <Typography>{`Are you sure you want to delete ${props.name}?`}</Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant={"contained"} onClick={handleClose}>
            Cancel
          </Button>
          <Button variant={"contained"} onClick={handleDelete} disabled={deleting} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
