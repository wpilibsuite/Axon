import { GetCheckpoints_project_checkpoints } from "./__generated__/GetCheckpoints";
import { Tooltip, Button } from "@material-ui/core";
import { useMutation } from "@apollo/client";
import React, { ReactElement } from "react";
import { gql } from "@apollo/client";
type Checkpoint = GetCheckpoints_project_checkpoints;

const EXPORT_CHECKPOINT_MUTATION = gql`
  mutation exportCheckpoint($id: ID!, $checkpointID: String!) {
    exportCheckpoint(id: $id, checkpointID: $checkpointID) {
      id
    }
  }
`;

export function ExportButton(props: { id: string; selected: Checkpoint | null; onExport: () => void }): ReactElement {
  const [exportCheckpoint] = useMutation(EXPORT_CHECKPOINT_MUTATION);
  const handleExport = () => {
    const checkpointID = props.selected?.id;
    const id = props.id;
    exportCheckpoint({ variables: { id, checkpointID } }).catch((err) => {
      console.log(err);
    });
    props.onExport();
  };

  if (props.selected === null)
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
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
