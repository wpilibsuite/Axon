import { IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Container } from "@material-ui/core";
import React, { ReactElement } from "react";
import Chart from "./Chart";
import ExportButton from "./ExportButton";
import * as path from "path";
import { GetProjectData_project_checkpoints } from "../__generated__/GetProjectData";

export default function Metrics(props: {
  id: string;
  checkpoints: GetProjectData_project_checkpoints[];
  dockerState: number;
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
    checkpoints: GetProjectData_project_checkpoints[] | undefined,
    stepNumber: number
  ): GetProjectData_project_checkpoints | null {
    let index = 0;
    if (checkpoints) {
      while (index < checkpoints.length) {
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
          {props.dockerState > 4 ? (
            <ExportButton id={props.id} ckptNumber={selectedEpoch} />
          ) : (
            <p> export image not available yet </p>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

function CheckpointInfo(props: { checkpoint: GetProjectData_project_checkpoints | null }): JSX.Element {
  if (props.checkpoint) {
    const metrics = props.checkpoint.metrics;
    return (
      <>
        <Container>
          {Object.keys(metrics).map((key: string) =>
            key !== "__typename" ? <p key={key}>{`${key}:  ${props.checkpoint?.metrics.precision}`}</p> : null
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
          {props.checkpoint.status.downloadPaths.length > 0 ? (
            <>
              <p>Exports available at:</p>
              <ul>
                {props.checkpoint.status.downloadPaths.map((downloadPath) => (
                  <li key={downloadPath}>
                    <a download href={`http://localhost:4000/${downloadPath}`}>
                      <IconButton>{path.basename(downloadPath)}</IconButton>
                    </a>
                  </li>
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
