import { UpdateHyperparameters, UpdateHyperparametersVariables } from "./__generated__/UpdateHyperparameters";
import { GetHyperparameters, GetHyperparametersVariables } from "./__generated__/GetHyperparameters";
import { GetProjectData_project_datasets } from "../__generated__/GetProjectData";
import { createStyles, TextField, Theme } from "@material-ui/core";
import { gql, useMutation, useQuery } from "@apollo/client";
import { makeStyles } from "@material-ui/core/styles";
import { ReactElement } from "react";
import React from "react";
import Datasets from "./Datasets";

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

const GET_HYPERPARAMETERS = gql`
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
    }
  })
);

export default function Parameters(props: { id: string; datasets: GetProjectData_project_datasets[] }): ReactElement {
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
          epochs: data?.project?.epochs || -1,
          batchSize: data?.project?.batchSize || -1,
          evalFrequency: data?.project?.evalFrequency || -1,
          percentEval: data?.project?.percentEval || -1,
          [event.target.name]: Number(event.target.value)
        }
      }
    });
  };

  return (
    <form className={classes.root}>
      <fieldset style={{ all: "unset" }}>
        <TextField
          name="epochs"
          label="Epochs"
          variant="outlined"
          type="number"
          value={data?.project?.epochs}
          onChange={handleOnChange}
        />
        <TextField
          name="batchSize"
          label="Batch Size"
          variant="outlined"
          type="number"
          value={data?.project?.batchSize}
          onChange={handleOnChange}
        />
        <TextField
          name="evalFrequency"
          label="Evaluation Frequency"
          variant="outlined"
          type="number"
          value={data?.project?.evalFrequency}
          onChange={handleOnChange}
        />
        <TextField
          name="percentEval"
          label="Percent Evaluation"
          variant="outlined"
          type="number"
          value={data?.project?.percentEval}
          onChange={handleOnChange}
        />
        <Datasets id={props.id} selected={props.datasets} />
      </fieldset>
    </form>
  );
}
