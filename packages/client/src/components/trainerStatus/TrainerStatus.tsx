import React, { ReactElement } from "react";
import { Typography, Dialog, DialogTitle, DialogContent } from "@material-ui/core";
import { DockerState } from "../../__generated__/globalTypes";
import { GetDockerState } from "./__generated__/GetDockerState";
import { gql, useQuery } from "@apollo/client";

export const GET_DOCKER_STATE = gql`
  query GetDockerState {
    dockerState
  }
`;

export default function TrainerStatus(): ReactElement {
  const options = { pollInterval: 5000 };
  const { data, loading, error } = useQuery<GetDockerState>(GET_DOCKER_STATE, options);

  if (loading) return <p>connecting to trainer</p>;
  if (error) return <p>cant connect to trainer</p>;

  let statusMessage;
  switch (data?.dockerState) {
    case DockerState.NO_DOCKER:
      statusMessage = "ERROR: docker wont respond.";
      break;
    case DockerState.SCANNING_FOR_DOCKER:
      statusMessage = "connecting to docker";
      break;
    case DockerState.TRAIN_PULL:
      statusMessage = "downloading training images";
      break;
    case DockerState.EXPORT_PULL:
      statusMessage = "downloading export images";
      break;
    case DockerState.TEST_PULL:
      statusMessage = "downloading testing images";
      break;
    case DockerState.READY:
      statusMessage = "Ready";
      break;
    default:
      statusMessage = "no state recieved";
  }

  return (
    <>
      <Typography variant="body2" color="textSecondary" align="center">
        {statusMessage}
      </Typography>
      <Dialog open={data?.dockerState === DockerState.NO_DOCKER}>
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
