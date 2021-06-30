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

export default function DeleteProjectDialogButton(props: {
  project: GetProjectData_project;
  handler: () => void;
}): ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);
  const [deleteProject] = useMutation(DELETE_PROJECT_MUTATION);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = () => {
    deleteProject({ variables: { id: props.project.id } }).then(() => {
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
        <DialogTitle>Confirm Project Deletion</DialogTitle>
        <DialogContent dividers>
          <p>
            {" "}
            Are you sure you want to permanently delete project &ldquo;{props.project.name}&rdquo;? This action cannot
            be undone.{" "}
          </p>
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
