import { Dialog, DialogActions, DialogContent, DialogTitle, Container } from "@material-ui/core";
import React, { ReactElement } from "react";
import { gql, useQuery } from "@apollo/client";
import {
  GetProjectCheckpoints,
  GetProjectCheckpointsVariables,
  GetProjectCheckpoints_project_checkpoints,
  GetProjectCheckpoints_project_checkpoints_status
} from "./__generated__/GetProjectCheckpoints";
import Chart from "./Chart";
import ExportButton from "./ExportButton";

const GET_PROJECT_CHECKPOINTS = gql`
  query GetProjectCheckpoints($id: ID!) {
    project(id: $id) {
      checkpoints {
        step
        metrics {
          precision
        }
        status {
          exporting
          exportPaths
        }
      }
    }
  }
`;

export default function Metrics(props: { id: string }): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [selectedEpoch, setSelectedEpoch] = React.useState(0);

  const { data, loading, error } = useQuery<GetProjectCheckpoints, GetProjectCheckpointsVariables>(
    GET_PROJECT_CHECKPOINTS,
    {
      variables: {
        id: props.id
      },
      pollInterval: 3000
    }
  );

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

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <>
      <Chart checkpoints={data.project?.checkpoints} onClick={onClick} />
      {/* 
      //keeping this for now because we may still want a list of some sort
      <Container>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Epoch</TableCell>
              <TableCell>Precision</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.project?.checkpoints.map((checkpoint) => (
              <TableRow key={checkpoint.step}>
                <TableCell>{checkpoint.step}</TableCell>
                <TableCell>{checkpoint.metrics.precision}</TableCell>
                <TableCell>
                  <ExportButton id={props.id} ckptNumber={checkpoint.step} status={checkpoint.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container> */}
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>{`Epoch ${selectedEpoch}`}</DialogTitle>
        <DialogContent dividers>
          <CheckpointInfo checkpoint={getCheckpointFromStep(data.project?.checkpoints, selectedEpoch)} />
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
