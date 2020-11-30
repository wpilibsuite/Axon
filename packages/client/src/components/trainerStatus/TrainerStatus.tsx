import React, { ReactElement } from "react";
import { Typography, Dialog, DialogTitle, DialogContent } from "@material-ui/core";
import { gql, useQuery } from "@apollo/client";
import { GetTrainerState } from "./__generated__/GetTrainerState";
//hi
enum TrainerState {
  NO_DOCKER_INSTALLED,
  SCANNING_FOR_DOCKER,
  SCANNING_PROJECTS,
  DATASET_PULL,
  METRICS_PULL,
  TRAINER_PULL,
  EXPORT_PULL,
  TEST_PULL,
  READY,
  NO_DATA
}

const GET_TRAINER_STATE = gql`
  query GetTrainerState {
    trainerState
  }
`;

export default function TrainerStatus(): ReactElement {
  const options = { pollInterval: 5000 };
  const { data, loading, error } = useQuery<GetTrainerState>(GET_TRAINER_STATE, options);

  if (loading) return <p>connecting to trainer</p>;
  if (error) return <p>cant connect to trainer</p>;

  return (
    <>
      <Typography variant="body2" color="textSecondary" align="center">
        {
          [
            <p key={0}>ERROR: docker wont respond.</p>,
            <p key={1}>connecting to docker</p>,
            <p key={2}>scanning files</p>,
            <p key={3}>downloading dataset preparation container image</p>,
            <p key={4}>downloading metrics reader container image</p>,
            <p key={5}>downloading training container image</p>,
            <p key={6}>downloading export container image</p>,
            <p key={7}>downloading test container image</p>,
            <p key={8}>Ready</p>,
            <p key={9}>no data from trainer</p>
          ][data ? data.trainerState : TrainerState.NO_DATA]
        }
      </Typography>
      <Dialog open={data?.trainerState === 0}>
        <DialogTitle>Docker Error</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" align="center">
            <p>
              There was an error when trying to fetch data from docker. Please install/enable docker and restart the
              application.
            </p>
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
