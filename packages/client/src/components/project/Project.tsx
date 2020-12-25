import React, { ReactElement } from "react";
import { AppBar, Box, Tab, Tabs } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Input from "./input/Input";
import Metrics from "./metrics/Metrics";
import Results from "./results/Results";
import { gql, useQuery } from "@apollo/client";
import { GetProjectData, GetProjectDataVariables } from "./__generated__/GetProjectData";

import DatabaseTestButton from "./DatabaseTestButton";

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
  }
}));

const GET_PROJECT_DATA = gql`
  query GetProjectData($id: ID!) {
    project(id: $id) {
      id
      checkpoints {
        step
        metrics {
          precision
        }
        status {
          exporting
          downloadPaths
        }
      }
      exports {
        id
        projectId
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
      status {
        trainingStatus
        currentEpoch
        lastEpoch
      }
    }
    dockerState
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
      <div className={classes.root}>
        <AppBar position="static" color="default">
          <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary" centered>
            <Tab color="inherit" label="Input" />
            <Tab label="Metrics" />
            <Tab label="Output" />
          </Tabs>
        </AppBar>
        <TabPanel value={value} index={0}>
          <Input id={props.id} status={data.project.status} dockerState={data.dockerState} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Metrics id={props.id} checkpoints={data.project.checkpoints} dockerState={data.dockerState} />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Results
            id={props.id}
            exports={data.project.exports}
            dockerState={data.dockerState}
            videos={data.project.videos}
          />
        </TabPanel>
        <DatabaseTestButton id={props.id} />
      </div>
    );
  } else {
    return <p> Error: cannot retrieve project data from server </p>;
  }
}
