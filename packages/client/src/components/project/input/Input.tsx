import {
  LinearProgress,
  Typography,
  Box,
  Grid,
  DialogTitle,
  Dialog,
  DialogActions,
  Button,
  DialogContent
} from "@material-ui/core";
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
  const [open, setOpen] = React.useState(false);
  const [lastStep, setLastStep] = React.useState(false);
  const { data, loading, error } = useQuery<GetTrainjobs>(GET_TRAINJOBS, {
    pollInterval: 2000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  const trainjob = data.trainjobs.find((job) => job.projectID === props.id);

  if (trainjob === undefined) {
    if (lastStep) {
      setOpen(true);
      setLastStep(false);
    }
    return (
      <>
        <Dialog open={open}>
          <DialogTitle>Training Complete</DialogTitle>
          <DialogContent>
            <Typography>
              Your model has finished training. Choose a checkpoint from the graph and export it to test it or use it on
              your robot.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              variant={"contained"}
              onClick={() => {
                setOpen(false);
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Grid container spacing={3} justify={"center"} alignItems={"center"} style={{ width: "100%" }}>
          <Grid item xs={11}>
            <Parameters id={props.id} datasets={props.datasets} />
          </Grid>
          <Grid item xs={1}>
            <StartButton id={props.id} selected={props.datasets} />
          </Grid>
        </Grid>
      </>
    );
  }

  let statusMessage;
  switch (trainjob.status) {
    case TrainStatus.Idle:
      if (lastStep) {
        setLastStep(false);
      }
      statusMessage = "Idling";
      break;
    case TrainStatus.Paused:
      statusMessage = "Paused";
      break;
    case TrainStatus.Writing:
      statusMessage = "Writing parameters";
      break;
    case TrainStatus.Cleaning:
      statusMessage = "Cleaning data";
      break;
    case TrainStatus.Moving:
      statusMessage = "Moving data";
      break;
    case TrainStatus.Extracting:
      if (lastStep) {
        setLastStep(false);
      }
      statusMessage = "Extracting dataset";
      break;
    case TrainStatus.Training:
      if (!lastStep) {
        setLastStep(true);
      }
      statusMessage = "Training";
      break;
    case TrainStatus.Stopped:
      if (!lastStep) {
        setLastStep(true);
      }
      statusMessage = "Finishing up";
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

  function LinearProgressWithLabel(props: { value: number }) {
    return (
      <Box display="flex" alignItems="center">
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" value={props.value} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(props.value)}%`}</Typography>
        </Box>
      </Box>
    );
  }

  function ProgressBar(): ReactElement {
    const currentEpoch = trainjob?.currentEpoch ? trainjob?.currentEpoch : 0;
    const lastEpoch = trainjob?.lastEpoch ? trainjob?.lastEpoch : 1000;

    return (
      <>
        <LinearProgressWithLabel value={(100 * currentEpoch) / lastEpoch} />
        <p>{`Epoch ${trainjob?.currentEpoch} / ${trainjob?.lastEpoch}`}</p>
      </>
    );
  }
}
