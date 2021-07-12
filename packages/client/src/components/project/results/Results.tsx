import { Radio, Typography, Card, Grid } from "@material-ui/core";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetTestjobs_testjobs } from "./__generated__/GetTestjobs";
import { gql, useQuery } from "@apollo/client";
import ExportJobsList from "./ExportJobsList";
import React, { ReactElement } from "react";
import ExportButtons from "./ExportButtons";

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
  const [selectedExport, setExprt] = React.useState<GetProjectData_project_exports>();

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  return (
    <>
      {props.exports.length > 0 && <Typography>Exported Models</Typography>}
      <ExportJobsList id={props.id} />
      <ExportButtons exprt={selectedExport} videos={props.videos} jobs={data.testjobs} />
      <Grid container spacing={3}>
        {props.exports.map((exprt) => (
          <ExportInfo
            exprt={exprt}
            videos={props.videos}
            jobs={data.testjobs}
            key={exprt.name}
            selected={selectedExport}
            setSelected={setExprt}
          />
        ))}
      </Grid>
    </>
  );
}

function ExportInfo(props: {
  exprt: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
  jobs: GetTestjobs_testjobs[];
  selected: GetProjectData_project_exports | undefined;
  setSelected: (arg: GetProjectData_project_exports) => void;
}): JSX.Element {
  return (
    <Grid item xs={4} key={props.exprt.name}>
      <Card onClick={() => props.setSelected(props.exprt)} style={{ width: "100%", padding: "5px" }}>
        <Grid container spacing={3}>
          <Grid item>
            <Radio checked={props.selected !== undefined && props.exprt.id === props.selected.id} color={"primary"} />
          </Grid>
          <Grid item>
            <Typography variant={"h6"}>Export: {props.exprt.name}</Typography>
            <Typography>Epoch: {props.exprt.step}</Typography>
            <Typography>Precision: {Math.round(props.exprt.precision * 1000) / 1000}</Typography>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
}
