import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
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
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";
import { gql, useQuery } from "@apollo/client";
import { GetExportjobs_exportjobs } from "./__generated__/GetExportjobs";
import { CircularProgress } from "@material-ui/core";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";

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

export default function Metrics(props: {
  id: string;
  checkpoints: GetProjectData_project_checkpoints[];
  exports: GetProjectData_project_exports[];
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
      <Grid container spacing={3}>
        <Grid item xs={9}>
          <Typography variant={"h4"} style={{ paddingBottom: 10 }} align={"center"}>
            Metrics graph
          </Typography>
          <Chart checkpoints={props.checkpoints} onClick={onSet} />
        </Grid>
        <Grid item xs={3}>
          <CheckpointInfo
            checkpoint={selectedCheckpoint}
            exports={props.exports}
            jobs={data.exportjobs}
            id={props.id}
          />
          <Exportjobs jobs={data.exportjobs} id={props.id} />
        </Grid>
      </Grid>
    </>
  );
}

function CheckpointInfo(props: {
  checkpoint: GetProjectData_project_checkpoints | undefined;
  exports: GetProjectData_project_exports[] | undefined;
  jobs: GetExportjobs_exportjobs[];
  id: string;
}): JSX.Element {
  if (props.checkpoint) {
    const job = props.jobs.find((job) => job.projectID === props.id && job.checkpointID === props.checkpoint?.id);
    return (
      <Card variant="outlined">
        <Grid spacing={5} container direction="row" justify="center" alignItems="center">
          <Grid item xs={12} justify="center">
            <Typography variant={"h6"} align={"center"}>{`Epoch ${props.checkpoint.step}`}</Typography>
          </Grid>
          <Grid item xs={6}>
            <MetricsList checkpoint={props.checkpoint} />
          </Grid>
          <Grid item xs={6}>
            <ExportsList checkpoint={props.checkpoint} exports={props.exports} />
          </Grid>
          <Grid item xs={12} justify="center" alignItems="center">
            <ExportButton id={props.id} checkpoint={props.checkpoint} job={job} />
          </Grid>
        </Grid>
      </Card>
    );
  }
  return (
    <Card variant="outlined">
      <Grid spacing={5} container direction="row" justify="center" alignItems="center">
        <Grid item xs={12} justify="center">
          <Typography>No checkpoint selected from graph</Typography>
        </Grid>
      </Grid>
    </Card>
  );
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
              <TableCell align="right">{metric.value.toFixed(5)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ExportsList(props: {
  checkpoint: GetProjectData_project_checkpoints | undefined;
  exports: GetProjectData_project_exports[] | undefined;
}): JSX.Element {
  const ckptExports = props.exports ? props.exports.filter((exprt) => exprt.checkpointID === props.checkpoint?.id) : [];

  return (
    <>
      <Typography variant="body1">Exported Models:</Typography>
      <List dense={true}>
        {ckptExports.map((exprt) => (
          <ListItem key={exprt.id}>
            <ListItemIcon>
              <IconButton>
                <a download href={`http://localhost:4000/${exprt.downloadPath}`}>
                  <CloudDownloadIcon />
                </a>
              </IconButton>
            </ListItemIcon>
            <ListItemText primary={path.basename(exprt.downloadPath)} />
          </ListItem>
        ))}
      </List>
    </>
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
            <ListItemText primary={`exporting checkpoint "${job.name}"`} secondary={job.exportID} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
