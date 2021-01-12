import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";
import AddIcon from "@material-ui/icons/Add";
import { TreeItem } from "@material-ui/lab";

const CREATE_PROJECT_MUTATION = gql`
  mutation AddProject($name: String!) {
    createProject(name: $name) {
      id
    }
  }
`;

export default function AddProjectDialogButton(): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [createProject] = useMutation(CREATE_PROJECT_MUTATION);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleCreate = () => {
    createProject({ variables: { name } }).then(() => {
      apolloClient.resetStore();
    });
    handleClose();
  };

  return (
    <TreeItem
      nodeId={"addbutton"}
      label={
        <>
          <Tooltip title="Add project">
            <Button startIcon={<AddIcon />} onClick={handleClickOpen} style={{ textTransform: "none" }}>
              <Typography variant={"body1"}>Add Project</Typography>
            </Button>
          </Tooltip>
          <Dialog onClose={handleClose} open={open}>
            <DialogTitle>Add Project</DialogTitle>
            <DialogContent dividers>
              <TextField
                onChange={(event) => setName(event.target.value)}
                autoFocus
                margin="dense"
                label="Project Name"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={handleClose}>
                Cancel
              </Button>
              <Button autoFocus onClick={handleCreate} color="primary">
                Create
              </Button>
            </DialogActions>
          </Dialog>
        </>
      }
    />
  );
}
