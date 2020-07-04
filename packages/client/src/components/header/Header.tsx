import * as React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { AppBar, FormControl, MenuItem, Select, Toolbar, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

function ProjectSelect() {
  const [projects] = React.useState([
    { id: 0, name: "2020 Power Cells" },
    { id: 1, name: "2019" },
    { id: 2, name: "2018" }
  ]);
  const [selected, setSelected] = React.useState(0);

  return (
    <FormControl>
      <Select value={selected} onChange={(e) => setSelected(e.target.value as number)}>
        {projects.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {project.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function Header() {
  const classes = useStyles();

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <Typography variant="h6" color="inherit" noWrap>
          Machine Learning App
        </Typography>
        <ProjectSelect />
      </Toolbar>
    </AppBar>
  );
}
