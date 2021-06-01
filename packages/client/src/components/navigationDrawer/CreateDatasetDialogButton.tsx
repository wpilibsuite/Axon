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
import { Add, ControlPoint, Create, RemoveCircleOutline } from "@material-ui/icons";

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
  const [keys, setKeys] = React.useState(["cat", "dog"]);
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
  const append = () => {
    const test: string[] = [...keys];
    setKeys(test.concat([" "]));
  };
  const update = (index: number, element: string) => {
    const test: string[] = [...keys];
    test[index] = element;
    setKeys(test);
  };
  const remove = (index: number) => {
    const test: string[] = [...keys];
    test.splice(index, 1);
    setKeys(test);
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>Create Dataset from OpenImages</DialogTitle>
        <DialogContent dividers>
          <Grid container alignItems="center" justify="center" style={{ maxWidth: "400px" }}>
            {keys.map((obj: string, index: number) => {
              return (
                <>
                  <Grid item xs={2} key={index}>
                    <IconButton onClick={() => remove(index)}>
                      <RemoveCircleOutline />
                    </IconButton>
                  </Grid>
                  <Grid item xs={10}>
                    <TextField
                      key={index}
                      placeholder={obj}
                      onChange={(event) => update(index, event.target.value)}
                      style={{ width: "100%" }}
                    />
                  </Grid>
                </>
              );
            })}
            <Grid item xs={12}>
              <IconButton style={{ justifyContent: "center" }} onClick={append}>
                <ControlPoint />
              </IconButton>
            </Grid>
          </Grid>
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
