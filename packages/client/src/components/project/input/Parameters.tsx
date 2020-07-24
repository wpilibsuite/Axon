import React from "react";
import { createStyles, TextField, Theme } from "@material-ui/core";
import Section from "../Section";
import { ReactElement } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { gql, useMutation, useQuery } from "@apollo/client";
import { GetHyperparameters, GetHyperparametersVariables } from "./__generated__/GetHyperparameters";
import { UpdateHyperparameters, UpdateHyperparametersVariables } from "./__generated__/UpdateHyperparameters";

const GET_HYPERPARAMETERS = gql`
  query GetHyperparameters($id: ID!) {
    project(id: $id) {
      id
      hyperparameters {
        epochs
        batchSize
        evalFrequency
        percentEval
      }
    }
  }
`;

const UPDATE_HYPERPARAMETERS = gql`
  mutation UpdateHyperparameters($id: ID!, $hyperparameters: HyperparametersInput!) {
    updateHyperparameters(id: $id, hyperparameters: $hyperparameters) {
      id
      hyperparameters {
        epochs
        batchSize
        evalFrequency
        percentEval
      }
    }
  }
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

export default function Parameters(props: { id: string }): ReactElement {
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
        hyperparameters: {
          [event.target.name]: Number(event.target.value)
        }
      },
      optimisticResponse: {
        updateHyperparameters: {
          __typename: "Project",
          id: props.id,
          hyperparameters: {
            __typename: "Hyperparameters",
            epochs: -1,
            batchSize: -1,
            evalFrequency: -1,
            percentEval: -1,
            ...data?.project?.hyperparameters,
            [event.target.name]: Number(event.target.value)
          }
        }
      }
    });
  };

  return (
    <Section title="Parameters">
      <form className={classes.root}>
        <fieldset style={{ all: "unset" }}>
          <TextField
            name="epochs"
            label="Epochs"
            variant="outlined"
            type="number"
            value={data?.project?.hyperparameters?.epochs}
            onChange={handleOnChange}
          />
          <TextField
            name="batchSize"
            label="Batch Size"
            variant="outlined"
            type="number"
            value={data?.project?.hyperparameters?.batchSize}
            onChange={handleOnChange}
          />
          <TextField
            name="evalFrequency"
            label="Evaluation Frequency"
            variant="outlined"
            type="number"
            value={data?.project?.hyperparameters?.evalFrequency}
            onChange={handleOnChange}
          />
          <TextField
            name="percentEval"
            label="Percent Evaluation"
            variant="outlined"
            type="number"
            value={data?.project?.hyperparameters?.percentEval}
            onChange={handleOnChange}
          />
        </fieldset>
      </form>
    </Section>
  );
}
