import React, { ReactElement } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography
} from "@material-ui/core";
import { useApolloClient } from "@apollo/client";
import { TreeItem } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { Add, ControlPoint, Create } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingTop: 10,
    paddingLeft: 10
  },
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
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

export default function CreateDatasetDialogButton(): ReactElement {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  // const [creating, setCreating] = React.useState(false);
  // const apolloClient = useApolloClient();
  //
  //
  // if (creating) {
  //   return <CircularProgress />;
  // }

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>Create Dataset from OpenImages</DialogTitle>
        <DialogContent dividers>
          <TextField placeholder={"Segway"} />
          <IconButton style={{ justifyContent: "center" }}>
            <ControlPoint />
          </IconButton>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button autoFocus>Create</Button>
        </DialogActions>
      </Dialog>
      <TreeItem
        nodeId={"createbuttondataset"}
        label={
          <Button component={"label"} className={classes.button} onClick={() => setOpen(true)}>
            <div className={classes.labelRoot}>
              {React.createElement(Create, { className: classes.labelIcon })}
              <Typography variant={"body1"}> Create Dataset</Typography>
            </div>
          </Button>
        }
      />
    </>
  );
}
