import { Typography, IconButton, Container } from "@material-ui/core";
import React, { ReactElement } from "react";
import Chart from "./Chart";
import ExportButton from "./ExportButton";
import * as path from "path";
import { GetProjectData_project_checkpoints } from "../__generated__/GetProjectData";

export default function Metrics(props: {
  id: string;
  checkpoints: GetProjectData_project_checkpoints[];
}): ReactElement {
  const [selectedCheckpoint, setSelectedCheckpoint] = React.useState<GetProjectData_project_checkpoints>();

  function onClick(stepNumber: number): void {
    const checkpoint = props.checkpoints.find((checkpoint) => checkpoint.step === stepNumber);
    setSelectedCheckpoint(checkpoint);
  }

  return (
    <>
      <Chart checkpoints={props.checkpoints} onClick={onClick} />
      <CheckpointInfo checkpoint={selectedCheckpoint} id={props.id} />
    </>
  );
}

function CheckpointInfo(props: {
  checkpoint: GetProjectData_project_checkpoints | undefined;
  id: string;
}): JSX.Element {
  if (props.checkpoint) {
    return (
      <>
        <Typography>{`Epoch ${props.checkpoint.step}`}</Typography>

        <Container>
          {props.checkpoint.metrics.map((metric) => (
            <p key={metric.name}>{`${metric.name}:  ${metric.value}`}</p>
          ))}
        </Container>

        <Container>
          <ExportButton id={props.id} checkpoint={props.checkpoint} />
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
