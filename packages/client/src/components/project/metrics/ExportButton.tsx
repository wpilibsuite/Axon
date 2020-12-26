import React, { ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip
} from "@material-ui/core";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { GetProjectData_project_checkpoints } from "../__generated__/GetProjectData";
import { GET_DOCKER_STATE } from "../../trainerStatus/TrainerStatus";

const EXPORT_CHECKPOINT_BUTTON_MUTATION = gql`
  mutation exportCheckpointButton($id: ID!, $checkpointNumber: Int!, $name: String!) {
    exportCheckpoint(id: $id, checkpointNumber: $checkpointNumber, name: $name) {
      id
    }
  }
`;

export default function ExportButton(props: {
  id: string;
  checkpoint: GetProjectData_project_checkpoints;
}): ReactElement {
  const [exportCheckpoint] = useMutation(EXPORT_CHECKPOINT_BUTTON_MUTATION);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleExport = () => {
    const id = props.id;
    const checkpointNumber = props.checkpoint.step;
    exportCheckpoint({ variables: { id, checkpointNumber, name } }).catch((err) => {
      console.log(err);
    });
    handleClose();
  };

  const { data, loading, error } = useQuery(GET_DOCKER_STATE, { pollInterval: 5000 });
  if (loading) return <p>connecting to exporter</p>;
  if (error) return <p>cant connect to exporter</p>;
  if (data.dockerState < 4) return <p>no export image yet</p>;

  return (
    <>
      <Tooltip title="Export">
        <IconButton onClick={handleClickOpen}>Export</IconButton>
      </Tooltip>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Export Checkpoint</DialogTitle>
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
