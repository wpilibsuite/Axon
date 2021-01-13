import { Container, List, ListItem, Typography, Card, Button } from "@material-ui/core";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import RenameExportButton from "./RenameExportButton";
import { gql, useQuery } from "@apollo/client";
import React, { ReactElement } from "react";
import ViewButton from "./ViewButton";
import TestButton from "./TestButton";

const GET_TESTJOBS = gql`
  query GetTestjobs {
    testjobs {
      testID
      exportID
      projectID
      streamPort
    }
  }
`;

export default function Results(props: {
  id: string;
  exports: GetProjectData_project_exports[];
  videos: GetProjectData_project_videos[];
}): ReactElement {
  const { data, loading, error } = useQuery(GET_TESTJOBS, {
    pollInterval: 2000
  });

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  return (
    <Container>
      {props.exports.length > 0 && <Typography>Exported Models</Typography>}
      <List>
        {props.exports.map((exprt) => (
          <Card key={exprt.name} variant="outlined">
            <ExportInfo exprt={exprt} videos={props.videos} jobs={data.testjobs} />
          </Card>
        ))}
      </List>
    </Container>
  );
}

function ExportInfo(props: {
  exprt: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
}): JSX.Element {
  const job = props.jobs.find((job) => job.exportID === props.exprt.id);
  const active = job !== undefined;

  return (
    <>
      <ListItem>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          {props.exprt.name}
        </Typography>
        {active && <ViewButton />}
        <TestButton active={active} modelExport={props.exprt} videos={props.videos} />
        <a download href={`http://localhost:4000/${props.exprt.downloadPath}`}>
          <Button variant="outlined">Download</Button>
        </a>
        <RenameExportButton id={props.exprt.id} />
      </ListItem>
    </>
  );
}
