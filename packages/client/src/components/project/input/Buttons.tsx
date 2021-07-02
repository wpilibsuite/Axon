import { ResumeTraining, ResumeTrainingVariables } from "./__generated__/ResumeTraining";
import { StartTraining, StartTrainingVariables } from "./__generated__/StartTraining";
import { PauseTraining, PauseTrainingVariables } from "./__generated__/PauseTraining";
import { StopTraining, StopTrainingVariables } from "./__generated__/StopTraining";
import { GetDockerState } from "../../trainerStatus/__generated__/GetDockerState";
import { DockerState, TrainStatus } from "../../../__generated__/globalTypes";
import { GetTrainjobs_trainjobs } from "./__generated__/GetTrainjobs";
import { GET_DOCKER_STATE } from "../../trainerStatus/TrainerStatus";
import { gql, useMutation, useQuery } from "@apollo/client";
import React, { ReactElement, useState } from "react";
import { Button, IconButton, Tooltip } from "@material-ui/core";
import { PlayCircleFilled } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { GET_HYPERPARAMETERS } from "./Parameters";
import { GET_DATASETS } from "./Datasets";
import { GetDatasets } from "./__generated__/GetDatasets";
import { GetHyperparameters, GetHyperparametersVariables } from "./__generated__/GetHyperparameters";
import { GetProjectData_project_dataset } from "../__generated__/GetProjectData";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  largeIcon: {
    width: 60,
    height: 60
  }
}));

const START_TRAINING = gql`
  mutation StartTraining($id: ID!) {
    startTraining(id: $id) {
      id
    }
  }
`;

export function StartButton(props: { id: string; selected: GetProjectData_project_dataset | null }): ReactElement {
  const classes = useStyles();
  const [startTraining] = useMutation<StartTraining, StartTrainingVariables>(START_TRAINING);
  const [starting, setStarting] = useState(false);

  const parameters = useQuery<GetHyperparameters, GetHyperparametersVariables>(GET_HYPERPARAMETERS, {
    variables: {
      id: props.id
    }
  });

  const dockerState = useQuery<GetDockerState>(GET_DOCKER_STATE, { pollInterval: 5000 });
  const datasets = useQuery<GetDatasets, GetDatasets>(GET_DATASETS);

  function isValidParameters() {
    return !(
      (parameters.data?.project?.epochs || 0) <= 0 ||
      (parameters.data?.project?.batchSize || 0) <= 0 ||
      (parameters.data?.project?.evalFrequency || 0) <= 0 ||
      (parameters.data?.project?.percentEval || 0) <= 0
    );
  }

  const handleClick = () => {
    if (isValidParameters() && props.selected !== null && props.selected.name.length !== 0) {
      startTraining({ variables: { id: props.id } });
      setStarting(true);
    }
  };

  if (!isValidParameters()) {
    return <Button disabled> Invalid Parameters </Button>;
  }

  if (props.selected == null || (props.selected !== null && props.selected.name.length === 0)) {
    return <Button disabled> Requires Dataset </Button>;
  }

  if (datasets.loading) return <p>Loading Datasets...</p>;
  if (datasets.error) return <p>Dataset Error :(</p>;
  if (parameters.loading) return <p>Loading Parameters...</p>;
  if (parameters.error) return <p>Parameter Error :(</p>;
  if (dockerState.loading) return <p>connecting to trainer</p>;
  if (dockerState.error) return <p>cant connect to trainer</p>;
  if (dockerState.data?.dockerState === DockerState.TRAIN_PULL) return <p>no train image yet</p>;
  if (starting) return <Button>Starting...</Button>;

  return (
    <Tooltip title={"Start training"}>
      <IconButton onClick={handleClick} color="primary">
        <PlayCircleFilled className={classes.largeIcon} />
      </IconButton>
    </Tooltip>
  );
}

const STOP_TRAINING = gql`
  mutation StopTraining($id: ID!) {
    stopTraining(id: $id) {
      id
    }
  }
`;

export function StopButton(props: { id: string }): ReactElement {
  const [stopTraining] = useMutation<StopTraining, StopTrainingVariables>(STOP_TRAINING);
  const [stopping, setStopping] = useState(false);

  const handleClick = () => {
    stopTraining({ variables: { id: props.id } });
    setStopping(true);
  };
  if (stopping) return <Button variant={"contained"}>Stopping...</Button>;

  return (
    <Button variant={"contained"} color={"primary"} onClick={handleClick}>
      Stop
    </Button>
  );
}

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

export function PauseButton(props: { id: string; job: GetTrainjobs_trainjobs }): ReactElement {
  const [pauseTraining] = useMutation<PauseTraining, PauseTrainingVariables>(PAUSE_TRAINING);
  const [resumeTraining] = useMutation<ResumeTraining, ResumeTrainingVariables>(RESUME_TRAINING);

  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);

  const handlePause = () => {
    pauseTraining({ variables: { id: props.id } });
    setPausing(true);
  };

  const handleResume = () => {
    resumeTraining({ variables: { id: props.id } });
    setResuming(true);
  };

  if (props.job.status === TrainStatus.Paused) {
    if (pausing) setPausing(false);
    if (resuming) return <Button>Resuming...</Button>;
    return (
      <Button variant={"contained"} onClick={handleResume}>
        Resume
      </Button>
    );
  } else {
    if (resuming) setResuming(false);
    if (pausing) return <Button>Pausing...</Button>;
    return (
      <Button variant={"contained"} onClick={handlePause}>
        Pause
      </Button>
    );
  }
}
