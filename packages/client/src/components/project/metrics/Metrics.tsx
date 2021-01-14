import { Tooltip, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { GetCheckpoints_project_checkpoints } from "./__generated__/GetCheckpoints";
import { GetExportjobs } from "./__generated__/GetExportjobs";
import { gql, useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client";
import React, { ReactElement } from "react";
import Chart from "./Chart";
type Checkpoint = GetCheckpoints_project_checkpoints;

const EXPORT_CHECKPOINT_MUTATION = gql`
  mutation exportCheckpoint($id: ID!, $checkpointID: String!, $name: String!) {
    exportCheckpoint(id: $id, checkpointID: $checkpointID, name: $name) {
      id
    }
  }
`;

export default function Metrics(props: { id: string }): ReactElement {
  const [selected, setSelected] = React.useState<Checkpoint | null>(null);
  const onCheckpoint = (checkpoint: Checkpoint) => {
    if (checkpoint === selected) setSelected(null);
    else setSelected(checkpoint);
  };
  const onExport = () => {
    setSelected(null);
  };

  return (
    <>
      <Chart id={props.id} onClick={onCheckpoint} selected={selected} />
      <ExportButton id={props.id} selected={selected} onExport={onExport} />
      <Exportjobs id={props.id} />
    </>
  );
}

export function ExportButton(props: { id: string; selected: Checkpoint | null; onExport: () => void }): ReactElement {
  const [exportCheckpoint] = useMutation(EXPORT_CHECKPOINT_MUTATION);
  const handleExport = () => {
    const name = `STEP-${props.selected?.step}-${new Date().getHours()}-${new Date().getMinutes()}`;
    const checkpointID = props.selected?.id;
    const id = props.id;
    exportCheckpoint({ variables: { id, checkpointID, name } }).catch((err) => {
      console.log(err);
    });
    props.onExport();
  };

  if (props.selected === null)
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Tooltip title="Use the graph to select a checkpoint.">
          <span>
            <Button variant="outlined" disabled>
              Export
            </Button>
          </span>
        </Tooltip>
      </div>
    );
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Button variant="outlined" color="primary" onClick={handleExport}>
        Export
      </Button>
    </div>
  );
}

const GET_EXPORTJOBS = gql`
  query GetExportjobs {
    exportjobs {
      name
      checkpointID
      projectID
      exportID
    }
  }
`;

function Exportjobs(props: { id: string }): JSX.Element {
  const { data, loading, error } = useQuery<GetExportjobs>(GET_EXPORTJOBS, {
    pollInterval: 2000
  });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  const projectJobs = data.exportjobs.filter((job) => job.projectID === props.id);
  return (
    <>
      <List dense={true}>
        {projectJobs.map((job) => (
          <ListItem key={job.checkpointID}>
            <ListItemIcon>
              <CircularProgress />
            </ListItemIcon>
            <ListItemText primary={`exporting checkpoint "${job.name}"`} secondary={job.exportID} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
