import React, { ReactElement } from "react";
import { AppBar, Box, Tab, Tabs } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Input from "./input/Input";
import Metrics from "./metrics/Metrics";
import Results from "./results/Results";

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

export default function Project(props: { id: string }): ReactElement {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<unknown>, newValue: number) => {
    setValue(newValue);
  };

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
        <Input id={props.id} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Metrics id={props.id} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Results id={props.id} />
      </TabPanel>
    </div>
  );
}
