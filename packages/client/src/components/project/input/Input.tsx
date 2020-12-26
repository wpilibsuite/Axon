import { Button, Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { StartTraining, StartTrainingVariables } from "./__generated__/StartTraining";
import { HaltTraining, HaltTrainingVariables } from "./__generated__/HaltTraining";
import { PauseTraining, PauseTrainingVariables } from "./__generated__/PauseTraining";
import { ResumeTraining, ResumeTrainingVariables } from "./__generated__/ResumeTraining";
import { GetProjectData_project_status } from "../__generated__/GetProjectData";
import { GET_DOCKER_STATE } from "../../trainerStatus/TrainerStatus";

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
  const lastEpoch = props.status.lastEpoch;
  const currentEpoch = props.status.currentEpoch;
  const status = props.status;
  const id = props.id;
  //^^ this is only to get around a props validation error when using
  //   the props in the function components defined within this function component. need help with this.

  if (props.status.trainingStatus === 0)
    return (
      <>
        <Datasets id={props.id} />
        <Divider />
        <Parameters id={props.id} />
        <Divider />
        <StartButton />
      </>
    );

  const statusMessage = [
    "not training",
    "training paused",
    "writing parameter file",
    "cleaning old data",
    "moving data",
    "extracting dataset",
    "training model",
    "training finished, wrapping up"
  ][props.status.trainingStatus];

  return (
    <Container>
      <h1>{statusMessage}</h1>
      <ProgressBar />
      <StopButton />
      <PauseButton />
    </Container>
  );

  function StartButton(): ReactElement {
    const [startTraining] = useMutation<StartTraining, StartTrainingVariables>(START_TRAINING);
    const [starting, setStarting] = useState(false);

    const handleClick = () => {
      startTraining({ variables: { id: id } });
      setStarting(true);
    };

    const { data, loading, error } = useQuery(GET_DOCKER_STATE, { pollInterval: 5000 });
    if (loading) return <p>connecting to trainer</p>;
    if (error) return <p>cant connect to trainer</p>;
    if (data.dockerState < 3) return <p>no train image yet</p>;
    if (starting) return <Button>Starting...</Button>;

    return <Button onClick={handleClick}>Start</Button>;
  }

  function StopButton(): ReactElement {
    const [haltTraining] = useMutation<HaltTraining, HaltTrainingVariables>(HALT_TRAINING);
    const [stopping, setStopping] = useState(false);

    const handleClick = () => {
      haltTraining({ variables: { id: id } });
      setStopping(true);
    };
    if (stopping) return <Button>Stopping...</Button>;

    return <Button onClick={handleClick}>Halt</Button>;
  }

  function PauseButton(): ReactElement {
    const [pauseTraining] = useMutation<PauseTraining, PauseTrainingVariables>(PAUSE_TRAINING);
    const [resumeTraining] = useMutation<ResumeTraining, ResumeTrainingVariables>(RESUME_TRAINING);

    const [pausing, setPausing] = useState(false);
    const [resuming, setResuming] = useState(false);

    const handlePause = () => {
      pauseTraining({ variables: { id: id } });
      setPausing(true);
    };

    const handleResume = () => {
      resumeTraining({ variables: { id: id } });
      setResuming(true);
    };

    if (status.trainingStatus === 1) {
      if (pausing) setPausing(false);
      if (resuming) return <Button>Resuming...</Button>;
      return <Button onClick={handleResume}>Resume</Button>;
    } else {
      if (resuming) setResuming(false);
      if (pausing) return <Button>Pausing...</Button>;
      return <Button onClick={handlePause}>Pause</Button>;
    }
  }

  function ProgressBar(): ReactElement {
    const CURRENT_EPOCH = typeof currentEpoch === "number" ? currentEpoch : "?";
    const LAST_EPOCH = typeof lastEpoch === "number" ? lastEpoch : "?";
    return (
      <Container>
        <p>{`Epoch ${CURRENT_EPOCH} / ${LAST_EPOCH}`}</p>
      </Container>
    );
  }
}
