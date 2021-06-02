import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography
} from "@material-ui/core";
// import gql from "graphql-tag";
// import { useApolloClient, useMutation } from "@apollo/client";
import { TreeItem } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { ControlPoint, Create, RemoveCircleOutline } from "@material-ui/icons";

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
  },
  mainContainer: {
    width: "400px"
  },
  textfield: {
    width: "100%"
  }
}));

// const CREATE_PROJECT_MUTATION = gql`
//   mutation AddProject($name: String!) {
//     createProject(name: $name) {
//       id
//     }
//   }
// `;

export default function CreateDatasetDialogButton(): ReactElement {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [keys, setKeys] = React.useState([""]);
  const [errors, setErrors] = React.useState([false])
  // const [createDataset] = useMutation(CREATE_PROJECT_MUTATION);
  // const apolloClient = useApolloClient();
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
    setKeys(test.concat([""]));
    const testErrors: boolean[] = [...errors];
    setErrors(testErrors.concat([false]));
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
    const testErrors: boolean[] = [...errors];
    testErrors.splice(index, 1);
    setErrors(testErrors);
  };

  const handleCreate = () => {
    let error = false;
    const testErrors: boolean[] = [...errors];
    for (let i = 0; i < keys.length; i++) {
      testErrors[i] = keys[i].length === 0;
      error = error || testErrors[i];
    }
    setErrors(testErrors);
    if (!error) {
      console.log("set");
    }
  }

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>Create Dataset from OpenImages</DialogTitle>
        <form autoComplete={"off"}>
          <DialogContent dividers>
            <Grid container alignItems="center" justify="center" className={classes.mainContainer}>
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
                        error={errors[index]}
                        helperText={errors[index]?"Please enter a class name or remove this field.":""}
                        key={index}
                        placeholder={"Type class name here"}
                        onChange={(event) => update(index, event.target.value)}
                        className={classes.textfield}
                      />
                    </Grid>
                  </>
                );
              })}
              <Grid item xs={12}>
                <IconButton onClick={append}>
                  <ControlPoint />
                </IconButton>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button variant={"contained"} onClick={handleClose}>Cancel</Button>
            <Button variant={"contained"} color={"primary"} autoFocus onClick={handleCreate}>Create</Button>
          </DialogActions>
        </form>
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
