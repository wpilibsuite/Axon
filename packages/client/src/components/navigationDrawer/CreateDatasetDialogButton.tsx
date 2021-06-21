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
  Link,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { TreeItem } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { CloudDownload, ControlPoint, Create, RemoveCircleOutline } from "@material-ui/icons";
import { CreateDataset } from "./__generated__/CreateDataset";

const useStyles = makeStyles((theme) => ({
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
  button: {
    textTransform: "none"
  },
  mainContainer: {
    width: "400px"
  },
  textfield: {
    width: "100%"
  },
  largeIcon: {
    width: 100,
    height: 100
  },
  openImageInfo: {
    paddingBottom: 15
  }
}));

enum CreateState {
  Entering,
  Creating,
  Failed,
  Done
}

const CREATE_DATASET_MUTATION = gql`
  mutation CreateDataset($classes: [String!]!, $maxImages: Int!) {
    createDataset(classes: $classes, maxImages: $maxImages) {
      success
      createID
      zipPath
    }
  }
`;

export default function CreateDatasetDialogButton(): ReactElement {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [keys, setKeys] = React.useState([""]);
  const [errors, setErrors] = React.useState([false]);
  const [maxNumber, setMaxNumber] = React.useState(0);
  const [numberError, setNumberError] = React.useState(false);
  const [createID, setCreateID] = React.useState("");
  const [zipPath, setZipPath] = React.useState("");
  const [createState, setCreateState] = React.useState(CreateState.Entering);

  const [createDataset] = useMutation<CreateDataset, CreateDataset>(CREATE_DATASET_MUTATION, {
    onCompleted({ createDataset }) {
      if (createDataset === null) {
        return;
      }
      console.log(createDataset);
      setCreateID(createDataset.createID);
      setZipPath(createDataset.zipPath);
      if (createDataset.success === 1) {
        setCreateState(CreateState.Done);
      } else {
        // class name not valid
        setCreateState(CreateState.Failed);
      }
    }
  });

  const handleClose = () => {
    setKeys([""]);
    setErrors([false]);
    setCreateID("");
    setMaxNumber(0);
    setNumberError(false);
    setOpen(false);
    setCreateState(CreateState.Entering);
  };
  const handleFailed = () => {
    setKeys([""]);
    setErrors([false]);
    setCreateID("");
    setMaxNumber(0);
    setNumberError(false);
    setCreateState(CreateState.Entering);
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
      setCreateState(CreateState.Creating);
      await createDataset({ variables: { classes: keys, maxImages: maxNumber } });
    }
  };

  const getContents = () => {
    if (createState === CreateState.Entering) {
      return getEnteringContents();
    } else if (createState === CreateState.Creating) {
      return getCreatingContents();
    } else if (createState === CreateState.Failed) {
      return getFailedContents();
    } else if (createState === CreateState.Done) {
      return getDoneContents();
    }
  };

  const getEnteringContents = () => {
    return (
      <Grid container className={classes.mainContainer}>
        <Grid item xs={12}>
          <Typography className={classes.openImageInfo}>
            This tool creates custom datasets from {}
            <Link
              rel={"noopener noreferrer"}
              href={
                "https://storage.googleapis.com/openimages/web/visualizer/index.html?set=train&type=detection&c=%2Fm%2F01yrx"
              }
              target={"_blank"}
            >
              Open Images
            </Link>
            . Check the {}
            <Link
              rel={"noopener noreferrer"}
              href={
                "https://storage.googleapis.com/openimages/web/visualizer/index.html?set=train&type=detection&c=%2Fm%2F01yrx"
              }
              target={"_blank"}
            >
              Open Images website
            </Link>
            {} for valid class names.
          </Typography>
        </Grid>
        {keys.map((obj: string, index: number) => {
          return (
            <>
              {index === 0 ? (
                <Grid item xs={2} />
              ) : (
                <Grid item xs={2}>
                  <IconButton onClick={() => remove(index)}>
                    <RemoveCircleOutline />
                  </IconButton>
                </Grid>
              )}
              <Grid item xs={10}>
                <TextField
                  error={errors[index]}
                  helperText={errors[index] ? "Please enter a class name or remove this field." : "Class name"}
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
            onChange={(event) => setMaxNumber(parseInt(event.target.value))}
          />
        </Grid>
      </Grid>
    );
  };

  const getCreatingContents = () => {
    return (
      <Typography variant={"body1"}>
        This will take a while to download and process the requested images. Please wait.
      </Typography>
    );
  };

  const getFailedContents = () => {
    return (
      <Typography>
        {" "}
        Invalid label {createID} entered. Please check the {}
        <Link
          rel={"noopener noreferrer"}
          href={
            "https://storage.googleapis.com/openimages/web/visualizer/index.html?set=train&type=detection&c=%2Fm%2F01yrx"
          }
          target={"_blank"}
        >
          Open Images
        </Link>
        {} site for valid labels.
      </Typography>
    );
  };

  const getDoneContents = () => {
    return (
      <Grid container justify={"center"}>
        <Tooltip title={"Download new dataset"}>
          <IconButton target={"_blank"} href={`http://localhost:4000/create/${zipPath}`}>
            <CloudDownload className={classes.largeIcon} />
          </IconButton>
        </Tooltip>
      </Grid>
    );
  };

  const getActions = () => {
    if (createState === CreateState.Entering) {
      return getEnteringActions();
    } else if (createState === CreateState.Creating) {
      return getCreatingActions();
    } else if (createState === CreateState.Failed) {
      return getFailedOptions();
    } else if (createState === CreateState.Done) {
      return getDoneActions();
    }
  };

  const getEnteringActions = () => {
    return (
      <>
        <Button variant={"contained"} onClick={handleClose}>
          Cancel
        </Button>
        <Button variant={"contained"} color={"primary"} autoFocus onClick={handleCreate}>
          Create
        </Button>
      </>
    );
  };

  const getCreatingActions = () => {
    return <CircularProgress />;
  };

  const getFailedOptions = () => {
    return (
      <>
        <Button variant={"contained"} onClick={handleFailed}>
          Back
        </Button>
        <Button variant={"contained"} onClick={handleClose}>
          Close
        </Button>
      </>
    );
  };

  const getDoneActions = () => {
    return (
      <Button variant={"contained"} onClick={handleClose}>
        Close
      </Button>
    );
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>Create Dataset from Open Images</DialogTitle>
        <form autoComplete={"off"}>
          <DialogContent dividers>{getContents()}</DialogContent>
          <DialogActions>{getActions()}</DialogActions>
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
