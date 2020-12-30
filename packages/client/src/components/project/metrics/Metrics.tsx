import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  Collapse,
  Grid,
  TableContainer,
  Paper,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead
} from "@material-ui/core";
import React, { ReactElement } from "react";
import Chart from "./Chart";
import ExportButton from "./ExportButton";
import * as path from "path";
import { GetProjectData_project_checkpoints } from "../__generated__/GetProjectData";
import { gql, useQuery } from "@apollo/client";
import { GetExportjobs_exportjobs } from "./__generated__/GetExportjobs";
import { CircularProgress } from "@material-ui/core";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";

const GET_EXPORTJOBS = gql`
  query GetExportjobs {
    exportjobs {
      checkpointID
      projectID
      exportID
    }
  }
`;

export default function Metrics(props: {
  id: string;
  checkpoints: GetProjectData_project_checkpoints[];
}): ReactElement {
  const [selectedCheckpoint, setSelectedCheckpoint] = React.useState<GetProjectData_project_checkpoints>();

  function onSet(stepNumber: number): void {
    const checkpoint = props.checkpoints.find((checkpoint) => checkpoint.step === stepNumber);
    setSelectedCheckpoint(checkpoint);
  }

  const { data, loading, error } = useQuery(GET_EXPORTJOBS, {
    pollInterval: 2000
  });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  return (
    <>
      <Chart checkpoints={props.checkpoints} onClick={onSet} />
      <Collapse in={selectedCheckpoint !== undefined} timeout="auto" unmountOnExit>
        <CheckpointInfo checkpoint={selectedCheckpoint} jobs={data.exportjobs} id={props.id} />
      </Collapse>
      <Exportjobs jobs={data.exportjobs} id={props.id} />
    </>
  );
}

function CheckpointInfo(props: {
  checkpoint: GetProjectData_project_checkpoints | undefined;
  jobs: GetExportjobs_exportjobs[];
  id: string;
}): JSX.Element {
  if (props.checkpoint) {
    const job = props.jobs.find(
      (job) => job.projectID === props.id && job.checkpointID === props.checkpoint?.step.toString()
    );
    return (
      <Card variant="outlined">
        <Grid spacing={5} container direction="row" justify="center" alignItems="center">
          <Grid item xs={12} justify="center">
            <Typography>{`Epoch ${props.checkpoint.step}`}</Typography>
          </Grid>
          <Grid>
            <Grid item>
              <MetricsList checkpoint={props.checkpoint} />
            </Grid>
            <Grid item>
              <ExportButton id={props.id} checkpoint={props.checkpoint} job={job} />
            </Grid>
          </Grid>
          <Grid container item xs={12} sm={6}>
            <Grid item xs={12}>
              <Typography variant="body1">Exported Models:</Typography>
            </Grid>
            <Grid item xs={12}>
              <ExportsList checkpoint={props.checkpoint} />
            </Grid>
          </Grid>
        </Grid>
      </Card>
    );
  }
  return <></>;
}

function MetricsList(props: { checkpoint: GetProjectData_project_checkpoints }): JSX.Element {
  const metrics: { name: string; value: number }[] = [];

  if (props.checkpoint.precision) metrics.push({ name: "precision", value: props.checkpoint.precision });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Metric</TableCell>
            <TableCell align="right">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.name}>
              <TableCell component="th" scope="row">
                {metric.name}
              </TableCell>
              <TableCell align="right">{metric.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ExportsList(props: { checkpoint: GetProjectData_project_checkpoints | undefined }): JSX.Element {
  return (
    <List dense={true}>
      {/* {props.checkpoint?.status.downloadPaths.map((downloadPath) => (
        <ListItem>
          <ListItemIcon>
            <IconButton>
              <a download href={`http://localhost:4000/${downloadPath}`}>
                <CloudDownloadIcon />
              </a>
            </IconButton>
          </ListItemIcon>
          <ListItemText primary={path.basename(downloadPath)} />
        </ListItem>
      ))} */}
    </List>
  );
}

function Exportjobs(props: { jobs: GetExportjobs_exportjobs[]; id: string }): JSX.Element {
  const projectJobs = props.jobs.filter((job) => job.projectID === props.id);

  return (
    <>
      <List dense={true}>
        {projectJobs.map((job) => (
          <ListItem key={job.checkpointID}>
            <ListItemIcon>
              <CircularProgress />
            </ListItemIcon>
            <ListItemText primary={`exporting checkpoint ${job.checkpointID}`} secondary={job.exportID} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
