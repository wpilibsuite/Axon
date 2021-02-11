import React, { ReactElement } from "react";
import {Container, Grid, IconButton, LinearProgress, Tooltip, Typography} from "@material-ui/core";
import logo from "../../assets/logo.png";
import { PlayArrow } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import Docker from "../../docker/Docker";
import Localhost from "../../docker/Localhost";
// import Dockerode from "dockerode"; // used for Dockerode.Container class

const Dockerode2 = window.require("dockerode"); // used for connecting to docker socket

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

const os = window.require("os");
const platform = os.platform();
const socket = {
  socketPath: platform.toLowerCase().startsWith("win") ? "//./pipe/docker_engine" : "/var/run/docker.sock"
};
const dockerode = new Dockerode2(socket);
const docker = new Docker(dockerode, socket);
const localhost = new Localhost();

export default function Launch(): ReactElement {
  const classes = useStyles();
  const [status, setStatus] = React.useState("OFF");

  const startContainer = async () => {
    // setPulling(true);
    setStatus("Pulling Axon image");
    await docker.pullImage();
    // setPulling(false);
    setStatus("Finished pulling.");
    // image downloaded
    const containers = await docker.getContainers();
    if (containers !== null && containers.length > 0) {
      setStatus("Removing old containers");
      await docker.reset();
    }
    setStatus("Creating container");
    const container = await docker.createContainer();
    // setContainer(container);
    // setContainerReady(true);
    console.log("Container created.");
    setStatus("Running container");
    docker.runContainer(container).then(() => {
      setStatus("OFF");
    });
    localhost.waitForStart();
  };
  const progress = status === "OFF" ? null : <LinearProgress/> ;

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
            <IconButton onClick={startContainer}>
              <PlayArrow className={classes.start} />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={12}>
          {status !== "OFF" && <Typography>{status}</Typography>}
        </Grid>
      </Grid>
      {progress}
    </Container>
  );
}
