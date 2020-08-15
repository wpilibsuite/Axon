import { Dialog, DialogActions, DialogContent, TextField, Button, DialogTitle } from "@material-ui/core";
import React, { ReactElement } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  GetProjectCheckpoints,
  GetProjectCheckpointsVariables,
  GetProjectCheckpoints_project_checkpoints_status
} from "./__generated__/GetProjectCheckpoints";
import Chart from "./Chart";

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
const EXPORT_CHECKPOINT_MUTATION = gql`
  mutation exportCheckpoint($id: ID!, $checkpointNumber: Int!, $name: String!) {
    exportCheckpoint(id: $id, checkpointNumber: $checkpointNumber, name: $name) {
      id
    }
  }
`;

export default function Metrics(props: { id: string }): ReactElement {
  const [exportCheckpoint] = useMutation(EXPORT_CHECKPOINT_MUTATION);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
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
  const handleExport = () => {
    const id = props.id;
    const checkpointNumber = selectedEpoch;
    exportCheckpoint({ variables: { id, checkpointNumber, name } }).catch((err) => {
      console.log(err);
    });
    handleClose();
  };
  const handleClose = () => {
    setOpen(false);
  };

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <>
      <Chart checkpoints={data.project?.checkpoints} onClick={onClick} />
      {/* <Container>
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
          <TextField
            onChange={(event) => setName(event.target.value)}
            autoFocus
            margin="dense"
            label="Model Name"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleExport} color="primary">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
