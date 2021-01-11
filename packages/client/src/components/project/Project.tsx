import { GetProjectData, GetProjectDataVariables } from "./__generated__/GetProjectData";
import { AppBar, Box, Tab, Tabs, Grid, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { gql, useQuery } from "@apollo/client";
import React, { ReactElement } from "react";
import Metrics from "./metrics/Metrics";
import Results from "./results/Results";
import Input from "./input/Input";
import Parameters from "./input/Parameters";
import Datasets from "./input/Datasets";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const GET_PROJECT_DATA = gql`
  query GetProjectData($id: ID!) {
    project(id: $id) {
      id
      checkpoints {
        id
        name
        step
        precision
      }
      exports {
        id
        projectID
        checkpointID
        name
        directory
        downloadPath
      }
      videos {
        id
        name
        filename
        fullPath
      }
    }
  }
`;

export default function Project(props: { id: string }): ReactElement {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const { data, loading, error } = useQuery<GetProjectData, GetProjectDataVariables>(GET_PROJECT_DATA, {
    variables: {
      id: props.id
    },
    pollInterval: 3000
  });

  const handleChange = (event: React.ChangeEvent<unknown>, newValue: number) => {
    setValue(newValue);
  };

  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;

  if (data?.project) {
    return (
      // <div className={classes.root}>
      //   <AppBar position="static" color="default">
      //     <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary" centered>
      //       <Tab color="inherit" label="Input" />
      //       <Tab label="Metrics" />
      //       <Tab label="Output" />
      //     </Tabs>
      //   </AppBar>
      //   <TabPanel value={value} index={0}>
      //     <Input id={props.id} />
      //   </TabPanel>
      //   <TabPanel value={value} index={1}>
      //     <Metrics id={props.id} checkpoints={data.project.checkpoints} exports={data.project.exports} />
      //   </TabPanel>
      //   <TabPanel value={value} index={2}>
      //     <Results id={props.id} exports={data.project.exports} videos={data.project.videos} />
      //   </TabPanel>
      // </div>

      <div className={classes.root}>
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Paper className={classes.paper}>Project Title Text</Paper>
          </Grid>
          <Grid item xs={9}>
            <Datasets id={props.id} />
            {/*<Paper className={classes.paper}>Data select text</Paper>*/}
          </Grid>
          <Grid item xs={12}>
            <Input id={props.id} />
            {/*<Paper className={classes.paper}>Progress and input Bar Text</Paper>*/}
          </Grid>
          <Grid item xs={9}>
            <Metrics id={props.id} checkpoints={data.project.checkpoints} exports={data.project.exports} />
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.paper}>checkpoint info text</Paper>
          </Grid>
          <Grid item xs={12}>
            <Results id={props.id} exports={data.project.exports} videos={data.project.videos} />
          </Grid>
        </Grid>
      </div>
    );
  } else {
    return <p> Error: cannot retrieve project data from server </p>;
  }
}
