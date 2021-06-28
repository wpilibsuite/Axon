import React, { ReactElement } from "react";
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link,
  Tooltip,
  Typography
} from "@material-ui/core";
import logo from "../../assets/logo.png";
import { PlayArrow } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import Docker from "../../docker/Docker";
import Localhost from "../../docker/Localhost";
import Dockerode from "dockerode"; // used for Dockerode.Container class
import StopIcon from "@material-ui/icons/Stop";
import * as https from "https";

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
  const [status, setStatus] = React.useState("OFF");
  const progress = status === "OFF" ? null : <LinearProgress />;
  const [open, setOpen] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const [activeContainer, setActiveContainer] = React.useState<Dockerode.Container | null>(null);

  const handleClose = () => {
    setClicked(true);
  };

  const startContainer = async () => {
    const connected = await docker.isConnected();
    if (connected) {
      // try {
      //   await pullContainers();
      // } catch(e){
      //   console.log("===================================");
      //   console.log(e);
      // }

      // setPulling(true);
      const options = {
        hostname: "google.com",
        port: 443,
        path: "/",
        method: "GET",
        headers: { "Access-Control-Allow-Origin": "*" }
      };

      const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        console.log("headers:", res.headers);
        if (res.statusCode === 200) {
          console.log("====================");
          pullContainers();
        }
      });

      req.end();

      req.on("error", (error) => {
        console.error(error);
      });

      setStatus("Creating container");
      const container = await docker.createContainer();
      // setContainer(container);
      // setContainerReady(true);
      console.log("Container created.");
      setStatus("Running container");
      docker.runContainer(container).then(() => {
        setStatus("OFF");
        setActiveContainer(null);
      });
      setActiveContainer(container);
      localhost.waitForStart();
    } else {
      setClicked(false);
    }
  };

  docker.isConnected().then((value) => {
    setOpen(!value && !clicked);
  });

  const pullContainers = async () => {
    setStatus("Pulling Axon image");
    console.log("hi");
    try {
      await docker.pullImage();
    } catch (e) {
      console.log("============");
    }
    console.log("yo");
    // setPulling(false);
    setStatus("Finished pulling.");
    // image downloaded
    const containers = await docker.getContainers();
    if (containers !== null && containers.length > 0) {
      setStatus("Removing old containers");
      await docker.reset();
    }
  };

  const stopContainer = async () => {
    if (activeContainer !== null) {
      if ((await activeContainer.inspect()).State.Running) {
        console.log("Stopping container");
        await activeContainer.stop();
      }
    }
  };

  return (
    <Container>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{"Issue Connecting to Docker"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Axon had trouble connecting to Docker. Please ensure Docker is installed. If this issue persists, file an
            issue <Link href="https://github.com/wpilibsuite/Axon/issues">here</Link>. Please include your log file.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      <div className={classes.centered}>
        <Typography variant="h3" gutterBottom>
          Axon Launcher
        </Typography>
      </div>
      <div className={classes.centered}>
        <img src={logo} alt={logo} className={classes.logo} />
      </div>
      <div className={classes.centered}>
        {status === "OFF" && (
          <Tooltip title={<h3>Start Axon in browser</h3>} className={classes.inline}>
            <IconButton onClick={startContainer}>
              <PlayArrow className={classes.start} />
            </IconButton>
          </Tooltip>
        )}
        {status !== "OFF" && (
          <Tooltip title={<h3>Stop Axon</h3>} placement={"right"}>
            <IconButton onClick={stopContainer}>
              <StopIcon className={classes.start} />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <div className={classes.centered}>{status !== "OFF" && <Typography>{status}</Typography>}</div>
      {progress}
    </Container>
  );
}
