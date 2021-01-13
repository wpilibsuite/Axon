import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@material-ui/core";
import { useApolloClient, useMutation } from "@apollo/client";
import React, { ReactElement } from "react";
import gql from "graphql-tag";
import { GetProjectData_project } from "./__generated__/GetProjectData";

const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProjectM($id: ID!) {
    deleteProject(id: $id) {
      id
    }
  }
`;

export default function DeleteProjectDialogButton(props: { project: GetProjectData_project }): ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);
  const [confirmation, setConfirmation] = React.useState<string>("");
  const [deleteProject] = useMutation(DELETE_PROJECT_MUTATION);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = () => {
    if (confirmation === props.project.name) {
      deleteProject({ variables: { id: props.project.id } }).then(() => {
        apolloClient.resetStore();
      });
      handleClose();
    }
  };

  return (
    <>
      <Button onClick={handleClickOpen}>Delete</Button>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Confirm Project Deletion</DialogTitle>
        <DialogContent dividers>
          <p> Please confirm project deletion by typing &ldquo;{props.project.name}&rdquo; </p>
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
