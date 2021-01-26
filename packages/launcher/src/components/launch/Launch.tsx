import React, { ReactElement } from "react";
import { Container, Grid, IconButton, Tooltip, Typography } from "@material-ui/core";
import logo from "../../assets/logo.png";
import { PlayArrow } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import Dockerode from "dockerode";
import Docker from "../../docker/Docker";

const useStyles = makeStyles((theme) => ({
  logo: {
    height: 200,
    width: 180
  },
  start: {
    height: 50,
    width: 50
  }
}));

const dockerode = new Dockerode();
const docker = new Docker(dockerode);

export default function About(): ReactElement {
  const classes = useStyles();

  docker.isImageReady().then(value => {
    console.log(value);
    console.log("image status ^^^^")
  });
  return (
    <Container>
      <Grid container spacing={6} direction="column" alignItems="center" justify="center">
        <Grid item xs={12}>
          <Typography variant="h3" gutterBottom>
            Axon Launcher
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <img src={logo} alt={logo} className={classes.logo} />
        </Grid>
        <Grid item xs={12}>
          <Tooltip title={<h3>Start Axon in browser</h3>} placement={"right"}>
            <IconButton>
              <PlayArrow className={classes.start} />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Container>
  );
}
