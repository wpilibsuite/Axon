import { Button, Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement } from "react";
import { gql, useMutation } from "@apollo/client";
import { StartTraining, StartTrainingVariables } from "./__generated__/StartTraining";
import { HaltTraining, HaltTrainingVariables } from "./__generated__/HaltTraining";
import { PauseTraining, PauseTrainingVariables } from "./__generated__/PauseTraining";
import { ResumeTraining, ResumeTrainingVariables } from "./__generated__/ResumeTraining";
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

const PAUSE_TRAINING = gql`
  mutation PauseTraining($id: ID!) {
    pauseTraining(id: $id) {
      id
    }
  }
`;

const RESUME_TRAINING = gql`
  mutation ResumeTraining($id: ID!) {
    resumeTraining(id: $id) {
      id
    }
  }
`;

export default function Input(props: { id: string; status: GetProjectData_project_status }): ReactElement {
  const [startTraining] = useMutation<StartTraining, StartTrainingVariables>(START_TRAINING);
  const [haltTraining] = useMutation<HaltTraining, HaltTrainingVariables>(HALT_TRAINING);
  const [pauseTraining] = useMutation<PauseTraining, PauseTrainingVariables>(PAUSE_TRAINING);
  const [resumeTraining] = useMutation<ResumeTraining, ResumeTrainingVariables>(RESUME_TRAINING);

  return (
    <Container>
      {
        [
          <>
            <Datasets id={props.id} />
            <Divider />
            <Parameters id={props.id} />
            <Divider />
            <Button onClick={() => startTraining({ variables: { id: props.id } })}>Start</Button>
          </>,
          <>
            <h1>Preparing</h1>
            <ProgressBar status={props.status} />
            <Button onClick={() => haltTraining({ variables: { id: props.id } })}>Halt</Button>
          </>,
          <>
            <h1>Training</h1>
            <ProgressBar status={props.status} />
            <Button onClick={() => haltTraining({ variables: { id: props.id } })}>Halt</Button>
            <Button onClick={() => pauseTraining({ variables: { id: props.id } })}>Pause</Button>
          </>,
          <>
            <h1>Paused</h1>
            <ProgressBar status={props.status} />
            <Button onClick={() => haltTraining({ variables: { id: props.id } })}>Halt</Button>
            <Button onClick={() => resumeTraining({ variables: { id: props.id } })}>Resume</Button>
          </>
        ][props.status.trainingState]
      }
    </Container>
  );
}

function ProgressBar(props: { status: GetProjectData_project_status }): ReactElement {
  const CURRENT_EPOCH = typeof props.status.currentEpoch === "number" ? props.status.currentEpoch : "?";
  const LAST_EPOCH = typeof props.status.lastEpoch === "number" ? props.status.lastEpoch : "?";
  return (
    <Container>
      <p>{`Epoch ${CURRENT_EPOCH} / ${LAST_EPOCH}`}</p>
    </Container>
  );
}
