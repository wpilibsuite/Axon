import { Dialog, DialogActions, DialogContent, DialogTitle, Container } from "@material-ui/core";
import React, { ReactElement } from "react";
import { GetProjectCheckpoints_project_checkpoints } from "../__generated__/GetProjectCheckpoints";
import Chart from "./Chart";
import ExportButton from "./ExportButton";

export default function Metrics(props: {
  id: string;
  checkpoints: GetProjectCheckpoints_project_checkpoints[];
}): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [selectedEpoch, setSelectedEpoch] = React.useState(0);

  function onClick(stepNumber: number): void {
    setSelectedEpoch(stepNumber);
    setOpen(true);
  }
  const handleClose = () => {
    setOpen(false);
  };

  //if this function still exists by next week scold me
  function getCheckpointFromStep(
    checkpoints: GetProjectCheckpoints_project_checkpoints[] | undefined,
    stepNumber: number
  ): GetProjectCheckpoints_project_checkpoints | null {
    let index = 0;
    if (checkpoints) {
      while (index < checkpoints.length) {
        console.log(checkpoints[index].step);
        if (checkpoints[index].step === stepNumber) {
          return checkpoints[index];
        }
        index = index + 1;
      }
    }
    return null;
  }

  return (
    <>
      <Chart checkpoints={props.checkpoints} onClick={onClick} />
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>{`Epoch ${selectedEpoch}`}</DialogTitle>
        <DialogContent dividers>
          <CheckpointInfo checkpoint={getCheckpointFromStep(props.checkpoints, selectedEpoch)} />
        </DialogContent>
        <DialogActions>
          <ExportButton id={props.id} ckptNumber={selectedEpoch} />
        </DialogActions>
      </Dialog>
    </>
  );
}

function CheckpointInfo(props: { checkpoint: GetProjectCheckpoints_project_checkpoints | null }): JSX.Element {
  if (props.checkpoint) {
    const metrics = props.checkpoint.metrics;
    return (
      <>
        <Container>
          {Object.keys(metrics).map((key: string) =>
            key !== "__typename" ? <p>{`${key}:  ${props.checkpoint?.metrics.precision}`}</p> : null
          )}
        </Container>
        <Container>
          {props.checkpoint.status.exporting ? (
            <p>Checkpoint is being exported</p>
          ) : (
            <p>Checkpoint available for export</p>
          )}
        </Container>
        <Container>
          {props.checkpoint.status.exportPaths.length > 0 ? (
            <>
              <p>Exports available at:</p>
              <ul>
                {props.checkpoint.status.exportPaths.map((exportPath) => (
                  <li key={exportPath}>{exportPath}</li>
                ))}
              </ul>
            </>
          ) : (
            <></>
          )}
        </Container>
      </>
    );
  }
  return <></>;
}
