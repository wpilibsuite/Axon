import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";
import AddIcon from "@material-ui/icons/Add";
import { TreeItem } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingTop: 10,
    paddingLeft: 10
  },
  labelRoot: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 0)
  },
  labelIcon: {
    marginRight: theme.spacing(1)
  },
  labelText: {
    fontWeight: "inherit",
    flexGrow: 1
  },
  button: {
    textTransform: "none"
  }
}));

const CREATE_PROJECT_MUTATION = gql`
  mutation AddProject($name: String!) {
    createProject(name: $name) {
      id
    }
  }
`;

export default function AddProjectDialogButton(): ReactElement {
  const classes = useStyles();
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
  const handleCreate = async () => {
    const projectRes = await createProject({ variables: { name } });
    await apolloClient.resetStore();
    window.location.href = "/projects/" + projectRes.data.createProject.id;
    handleClose();
  };

  return (
    <TreeItem
      nodeId={"addbutton"}
      label={
        <>
          <Tooltip title="Add project">
            <Button onClick={handleClickOpen} style={{ textTransform: "none" }}>
              <div className={classes.labelRoot}>
                {React.createElement(AddIcon, { className: classes.labelIcon })}
                <Typography variant={"body1"}>Add Project</Typography>
              </div>
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
              <Button variant={"contained"} onClick={handleClose}>
                Cancel
              </Button>
              <Button autoFocus variant={"contained"} onClick={handleCreate} color="primary">
                Create
              </Button>
            </DialogActions>
          </Dialog>
        </>
      }
    />
  );
}
