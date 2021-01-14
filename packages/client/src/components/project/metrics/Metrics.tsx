import { GetCheckpoints_project_checkpoints } from "./__generated__/GetCheckpoints";
import { ExportButton } from "./ExportButton";
import React, { ReactElement } from "react";
import Chart from "./Chart";
type Checkpoint = GetCheckpoints_project_checkpoints;

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
    </>
  );
}
