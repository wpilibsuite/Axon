import { UpdateHyperparameters, UpdateHyperparametersVariables } from "./__generated__/UpdateHyperparameters";
import { GetHyperparameters, GetHyperparametersVariables } from "./__generated__/GetHyperparameters";
import { GetProjectData_project_dataset } from "../__generated__/GetProjectData";
import { createStyles, FormControl, Grid, TextField, Theme, Tooltip, Typography } from "@material-ui/core";
import { gql, useMutation, useQuery } from "@apollo/client";
import { makeStyles } from "@material-ui/core/styles";
import { ReactElement } from "react";
import React from "react";
import Datasets from "./Datasets";
import { InfoOutlined } from "@material-ui/icons";

Parameters.fragments = {
  hyperparameters: gql`
    fragment Hyperparameters on Project {
      id
      epochs
      batchSize
      evalFrequency
      percentEval
    }
  `
};

export const GET_HYPERPARAMETERS = gql`
  query GetHyperparameters($id: ID!) {
    project(id: $id) {
      ...Hyperparameters
    }
  }
  ${Parameters.fragments.hyperparameters}
`;

const UPDATE_HYPERPARAMETERS = gql`
  mutation UpdateHyperparameters($id: ID!, $updates: ProjectUpdateInput!) {
    updateProject(id: $id, updates: $updates) {
      ...Hyperparameters
    }
  }
  ${Parameters.fragments.hyperparameters}
`;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      "& .MuiTextField-root": {
        margin: theme.spacing(1),
        width: "25ch"
      }
    },
    parametersContainer: {
      width: "100%"
    },
    info: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap"
    },
    infoIcon: {
      paddingLeft: "5px"
    }
  })
);

export default function Parameters(props: {
  id: string;
  dataset: GetProjectData_project_dataset | null;
}): ReactElement {
  const classes = useStyles();
  const { loading, error, data } = useQuery<GetHyperparameters, GetHyperparametersVariables>(GET_HYPERPARAMETERS, {
    variables: {
      id: props.id
    }
  });
  const [updateHyperparameters] = useMutation<UpdateHyperparameters, UpdateHyperparametersVariables>(
    UPDATE_HYPERPARAMETERS
  );

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Error :(</p>;
  }

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateHyperparameters({
      variables: {
        id: props.id,
        updates: {
          [event.target.name]: Number(event.target.value)
        }
      },
      optimisticResponse: {
        updateProject: {
          __typename: "Project",
          id: props.id,
          epochs: data?.project?.epochs || 0,
          batchSize: data?.project?.batchSize || 0,
          evalFrequency: data?.project?.evalFrequency || 0,
          percentEval: data?.project?.percentEval || 0,
          [event.target.name]: Number(event.target.value)
        }
      }
    });
  };

  return (
    <Grid container spacing={3} justify={"center"} alignItems={"center"} className={classes.parametersContainer}>
      <Grid item xs={12} md>
        <FormControl style={{ width: "100%" }}>
          <TextField
            name="epochs"
            margin={"normal"}
            InputLabelProps={{ style: { pointerEvents: "auto" } }}
            label={
              <div className={classes.info}>
                <Typography variant={"body2"}>Epochs</Typography>
                <Tooltip
                  title={
                    "The number of steps to train the model. More epochs means more chances for the model to improve, but too many epochs can lead to decreasing precision."
                  }
                >
                  <InfoOutlined className={classes.infoIcon} />
                </Tooltip>
              </div>
            }
            variant="outlined"
            type="number"
            value={data?.project?.epochs}
            onChange={handleOnChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} md>
        <FormControl style={{ width: "100%" }}>
          <TextField
            name="batchSize"
            margin={"normal"}
            InputLabelProps={{ style: { pointerEvents: "auto" } }}
            label={
              <div className={classes.info}>
                <Typography variant={"body2"}>Batch Size</Typography>
                <Tooltip
                  title={
                    "The number of images in each batch. Higher batch size means faster training, but requires more memory."
                  }
                >
                  <InfoOutlined className={classes.infoIcon} />
                </Tooltip>
              </div>
            }
            variant="outlined"
            type="number"
            value={data?.project?.batchSize}
            onChange={handleOnChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} md>
        <FormControl style={{ width: "100%" }}>
          <TextField
            name="evalFrequency"
            margin={"normal"}
            InputLabelProps={{ style: { pointerEvents: "auto" } }}
            label={
              <div className={classes.info}>
                <Typography variant={"body2"}>Evaluation Frequency</Typography>
                <Tooltip
                  title={
                    "The frequency of checkpoint generation. A lower frequency will better describe the model's performance, but too low of a frequency can become less useful and take too much time."
                  }
                >
                  <InfoOutlined className={classes.infoIcon} />
                </Tooltip>
              </div>
            }
            variant="outlined"
            type="number"
            value={data?.project?.evalFrequency}
            onChange={handleOnChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} md>
        <FormControl style={{ width: "100%" }}>
          <TextField
            name="percentEval"
            margin={"normal"}
            InputLabelProps={{ style: { pointerEvents: "auto" } }}
            label={
              <div className={classes.info}>
                <Typography variant={"body2"}>Percent Evaluation</Typography>
                <Tooltip
                  title={
                    "The percent of the dataset used for training versus validation. A higher percent means a a stronger training dataset, but a weaker validation dataset. 70 is a good percent in general."
                  }
                >
                  <InfoOutlined className={classes.infoIcon} />
                </Tooltip>
              </div>
            }
            variant="outlined"
            type="number"
            value={data?.project?.percentEval}
            onChange={handleOnChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} md>
        <FormControl style={{ width: "100%" }}>
          <Datasets id={props.id} selected={props.dataset} />
        </FormControl>
      </Grid>
    </Grid>
  );
}
