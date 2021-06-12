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
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
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

type Created = {
  success: number;
  createID: string;
};

const CREATE_DATASET_MUTATION = gql`
  mutation CreateDataset($classes: [String!]!, $maxImages: Int!) {
    createDataset(classes: $classes, maxImages: $maxImages) {
      success
      createID
    }
  }
`;

export default function CreateDatasetDialogButton(): ReactElement {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [keys, setKeys] = React.useState([""]);
  const [errors, setErrors] = React.useState([false]);
  const [maxNumber, setNumber] = React.useState(0);
  const [numberError, setNumberError] = React.useState(false);
  const [link, setLink] = React.useState("");

  const [createDataset] = useMutation<Created>(CREATE_DATASET_MUTATION, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    onCompleted({ createDataset }) {
      console.log(createDataset);
      setLink(createDataset.createID);
    }
  });
  // const apolloClient = useApolloClient();
  // const [creating, setCreating] = React.useState(false);
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

  const handleCreate = async () => {
    let error = false;
    const testErrors: boolean[] = [...errors];
    for (let i = 0; i < keys.length; i++) {
      testErrors[i] = keys[i].length === 0;
      error = error || testErrors[i];
    }
    setErrors(testErrors);
    if (isNaN(maxNumber) || maxNumber <= 0) {
      setNumberError(true);
      error = true;
    } else {
      setNumberError(false);
    }

    if (!error) {
      console.log("set");
      await createDataset({ variables: { classes: keys, maxImages: maxNumber } });
    }
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>Create Dataset from OpenImages</DialogTitle>
        <form autoComplete={"off"}>
          <DialogContent dividers>
            <Grid container className={classes.mainContainer}>
              {keys.map((obj: string, index: number) => {
                return (
                  <>
                    {index === 0 ? (
                      <Grid item xs={2} />
                    ) : (
                      <Grid item xs={2} key={index}>
                        <IconButton onClick={() => remove(index)}>
                          <RemoveCircleOutline />
                        </IconButton>
                      </Grid>
                    )}
                    <Grid item xs={10}>
                      <TextField
                        error={errors[index]}
                        helperText={errors[index] ? "Please enter a class name or remove this field." : "Class name"}
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
              <Grid item xs={12}>
                <TextField
                  error={numberError}
                  helperText={"Number of images per class"}
                  placeholder={"1000"}
                  type={"number"}
                  className={classes.textfield}
                  onChange={(event) => setNumber(parseInt(event.target.value))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button variant={"contained"} onClick={handleClose}>
              Cancel
            </Button>
            <Button variant={"contained"} color={"primary"} autoFocus onClick={handleCreate}>
              Create
            </Button>
            {link === "" ? (
              <p>None</p>
            ) : (
              <Button target={"_blank"} href={`http://localhost:4000/create/${link}/dataset.zip`}>
                Download
              </Button>
            )}
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
