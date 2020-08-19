import { Button, Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement } from "react";
import { gql, useMutation } from "@apollo/client";
import { StartTraining, StartTrainingVariables } from "./__generated__/StartTraining";
import { HaltTraining, HaltTrainingVariables } from "./__generated__/HaltTraining";
import { GetProjectData_project_status } from "../__generated__/GetProjectData";

const START_TRAINING = gql`
  mutation StartTraining($id: ID!) {
    startTraining(id: $id) {
      id
    }
  }
`;

const HALT_TRAINING = gql`
  mutation HaltTraining($id: ID!) {
    haltTraining(id: $id) {
      id
    }
  }
`;

export default function Input(props: { id: string; status: GetProjectData_project_status | null }): ReactElement {
  const [startTraining] = useMutation<StartTraining, StartTrainingVariables>(START_TRAINING);
  const [haltTraining] = useMutation<HaltTraining, HaltTrainingVariables>(HALT_TRAINING);

  return (
    <Container>
      {props.status && <TrainingStatus status={props.status} />}
      <Datasets id={props.id} />
      <Divider />
      <Parameters id={props.id} />
      <Divider />
      {props.status?.trainingInProgress === true && (
        <Button onClick={() => haltTraining({ variables: { id: props.id } })}>Halt</Button>
      )}
      {props.status?.trainingInProgress === false && (
        <Button onClick={() => startTraining({ variables: { id: props.id } })}>Start</Button>
      )}
    </Container>
  );
}

function TrainingStatus(props: { status: GetProjectData_project_status }): ReactElement {
  if (props.status.trainingInProgress) {
    const CURRENT_EPOCH = typeof props.status.currentEpoch === "number" ? props.status.currentEpoch : "?";
    const LAST_EPOCH = typeof props.status.lastEpoch === "number" ? props.status.lastEpoch : "?";
    return (
      <Container>
        <h1>training</h1>
        <p>{`Epoch ${CURRENT_EPOCH} / ${LAST_EPOCH}`}</p>
      </Container>
    );
  } else {
    return <h1>not training</h1>;
  }
}
