import React, { ReactElement } from "react";
import { Button, Container, Grid, IconButton, ListItem, Tooltip, Typography } from "@material-ui/core";
import logo from "../../assets/logo.png";
import { GetApp, PlayArrow } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import Docker from "../../docker/Docker";
import Localhost from "../../docker/Localhost";
import LogDownload from "./LogDownload";

const fs = window.require("fs");
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
  },
  centered: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10
  },
  inline: {
    display: "inline-flex"
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

  const startContainer = async () => {
    // setPulling(true);
    console.log("Pulling Axon image");
    await docker.pullImage();
    // setPulling(false);
    console.log("Finished pulling.");
    // image downloaded
    const containers = await docker.getContainers();
    if (containers !== null && containers.length > 0) {
      console.log("Removing old containers");
      await docker.reset();
    }
    console.log("Creating container");
    const container = await docker.createContainer();
    // setContainer(container);
    // setContainerReady(true);
    console.log("Container created.");
    console.log("Running container");
    docker.runContainer(container);
    localhost.waitForStart();
  };

  return (
    <Container>
      <div className={classes.centered}>
        <Typography variant="h3" gutterBottom>
          Axon Launcher
        </Typography>
      </div>
      <div className={classes.centered}>
        <img src={logo} alt={logo} className={classes.logo} />
      </div>
      <div className={classes.centered}>
        <Tooltip title={<h3>Start Axon in browser</h3>} className={classes.inline}>
          <IconButton onClick={startContainer}>
            <PlayArrow className={classes.start} />
          </IconButton>
        </Tooltip>
        <Tooltip title={<h3>Download log file</h3>} className={classes.inline}>
          <div>
            <LogDownload />
          </div>
        </Tooltip>
      </div>
    </Container>
  );
}
