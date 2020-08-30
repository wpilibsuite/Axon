import React, { ReactElement } from "react";
import { Typography } from "@material-ui/core";
import { gql, useQuery } from "@apollo/client";
import { GetTrainerState } from "./__generated__/GetTrainerState";

//trainer state enumeration
// const NO_DOCKER_INSTALLED = 0;
// const SCANNING_FOR_DOCKER = 1;
// const SCANNING_PROJECTS = 2;
// const DATASET_PULL = 3;
// const METRICS_PULL = 4;
// const TRAINER_PULL = 5;
// const EXPORT_PULL = 6;
// const TEST_PULL = 7;
const READY = 8;
// const NO_DATA = 9;

const GET_TRAINER_STATE = gql`
  query GetTrainerState {
    trainerState
  }
`;

export default function TrainerStatus(props: {
  trainerState: number;
  setTrainerState: (arg: number) => void;
}): ReactElement {
  const options = { pollInterval: props.trainerState === READY ? 0 : 3000 };
  const { data, loading, error } = useQuery<GetTrainerState>(GET_TRAINER_STATE, options);

  if (loading) return <p>connecting to trainer</p>;
  if (error) return <p>cant connect to trainer</p>;

  if (data) {
    if (data.trainerState !== props.trainerState) props.setTrainerState(data.trainerState);
  }

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
          ][props.trainerState]
        }
      </Typography>
    </>
  );
}
