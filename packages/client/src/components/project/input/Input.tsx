import { LinearProgress, Typography, Box, LinearProgressProps, Grid } from "@material-ui/core";
import { GetProjectData_project_datasets } from "../__generated__/GetProjectData";
import { StartButton, StopButton, PauseButton } from "./Buttons";
import { TrainStatus } from "../../../__generated__/globalTypes";
import { GetTrainjobs } from "./__generated__/GetTrainjobs";
import { gql, useQuery } from "@apollo/client";
import React, { ReactElement } from "react";
import Parameters from "./Parameters";

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

export default function Input(props: { id: string; datasets: GetProjectData_project_datasets[] }): ReactElement {
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
        <Grid container spacing={3} justify={"center"} alignItems={"center"} style={{width:"100%"}}>
          <Grid item xs={11}>
            <Parameters id={props.id} datasets={props.datasets} />
          </Grid>
          <Grid item xs={1}>
            <StartButton id={props.id} />
          </Grid>
        </Grid>
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
    <>
      <h1>{statusMessage}</h1>
      <ProgressBar />
      <StopButton id={props.id} />
      <PauseButton id={props.id} job={trainjob} />
    </>
  );

  function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
      <Box display="flex" alignItems="center">
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(props.value)}%`}</Typography>
        </Box>
      </Box>
    );
  }
  function ProgressBar(): ReactElement {
    const currentEpoch = trainjob?.currentEpoch ? trainjob?.currentEpoch : 999;
    const lastEpoch = trainjob?.lastEpoch ? trainjob?.lastEpoch : 999;

    return (
      <>
        <LinearProgressWithLabel value={currentEpoch / lastEpoch} />
        <p>{`Epoch ${trainjob?.currentEpoch} / ${trainjob?.lastEpoch}`}</p>
      </>
    );
  }
}
