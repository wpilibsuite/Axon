import { Button, Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { StartTraining, StartTrainingVariables } from "./__generated__/StartTraining";
import { HaltTraining, HaltTrainingVariables } from "./__generated__/HaltTraining";
import { PauseTraining, PauseTrainingVariables } from "./__generated__/PauseTraining";
import { ResumeTraining, ResumeTrainingVariables } from "./__generated__/ResumeTraining";
import { GET_DOCKER_STATE } from "../../trainerStatus/TrainerStatus";
import { GetDockerState } from "../../trainerStatus/__generated__/GetDockerState";
import { GetTrainjobs } from "./__generated__/GetTrainjobs";
import { TrainStatus } from "../../../__generated__/globalTypes";
import { DockerState } from "../../../__generated__/globalTypes";

const GET_TRAINJOBS = gql`
  query GetTrainjobs {
    trainjobs {
      status
      projectID
      currentEpoch
      lastEpoch
    }
  }
`;

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

export default function Input(props: { id: string }): ReactElement {
  const id = props.id;
  //^^ this is only to get around a props validation error when using
  //   the props in the function components defined within this function component. need help with this.

  const { data, loading, error } = useQuery<GetTrainjobs>(GET_TRAINJOBS, {
    pollInterval: 2000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  const trainjob = data.trainjobs.find((job) => job.projectID === props.id);

  if (trainjob === undefined)
    return (
      <>
        <Datasets id={props.id} />
        <Divider />
        <Parameters id={props.id} />
        <Divider />
        <StartButton />
      </>
    );

  let statusMessage;
  switch (trainjob.status) {
    case TrainStatus.Idle:
      statusMessage = "not training";
      break;
    case TrainStatus.Paused:
      statusMessage = "training paused";
      break;
    case TrainStatus.Writing:
      statusMessage = "writing parameter file";
      break;
    case TrainStatus.Cleaning:
      statusMessage = "cleaning old data";
      break;
    case TrainStatus.Moving:
      statusMessage = "moving data";
      break;
    case TrainStatus.Extracting:
      statusMessage = "extracting dataset";
      break;
    case TrainStatus.Training:
      statusMessage = "training model";
      break;
    case TrainStatus.Stopped:
      statusMessage = "training finished, wrapping up";
      break;
  }

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

    const { data, loading, error } = useQuery<GetDockerState>(GET_DOCKER_STATE, { pollInterval: 5000 });
    if (loading) return <p>connecting to trainer</p>;
    if (error) return <p>cant connect to trainer</p>;
    if (data?.dockerState === DockerState.TRAIN_PULL) return <p>no train image yet</p>;
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

    if (trainjob?.status === TrainStatus.Paused) {
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
    return (
      <Container>
        <p>{`Epoch ${trainjob?.currentEpoch} / ${trainjob?.lastEpoch}`}</p>
      </Container>
    );
  }
}
