import React, { ReactElement } from "react";
import { Typography, Dialog, DialogTitle, DialogContent } from "@material-ui/core";
import { gql, useQuery } from "@apollo/client";

export enum DockerState {
  NO_DOCKER,
  SCANNING_FOR_DOCKER,
  TRAIN_PULL,
  EXPORT_PULL,
  TEST_PULL,
  READY
}

export const GET_DOCKER_STATE = gql`
  query GetDockerState {
    dockerState
  }
`;

export default function TrainerStatus(): ReactElement {
  const options = { pollInterval: 5000 };
  const { data, loading, error } = useQuery(GET_DOCKER_STATE, options);

  if (loading) return <p>connecting to trainer</p>;
  if (error) return <p>cant connect to trainer</p>;

  return (
    <>
      <Typography variant="body2" color="textSecondary" align="center">
        {
          [
            <p key={0}>ERROR: docker wont respond.</p>,
            <p key={1}>connecting to docker</p>,
            <p key={2}>downloading training images</p>,
            <p key={3}>downloading export images</p>,
            <p key={4}>downloading testing</p>,
            <p key={5}>Ready</p>,
            <p key={6}>no data from trainer</p>
          ][data ? data.dockerState : 6]
        }
      </Typography>
      <Dialog open={data?.dockerState === 0}>
        <DialogTitle>Docker Error</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" align="center">
            <p>Cannot find docker. Please install/enable docker and restart the application.</p>
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
