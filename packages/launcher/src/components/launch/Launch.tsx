import React, { ChangeEvent, ReactElement } from "react";
import {
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Select,
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
import ResetDockerButton from "./ResetDockerButton";
import { IpcRenderer } from "electron";

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
  },
  selector: {
    width: "25%"
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
  const [axonVersions, setAxonVersions] = React.useState([""]);
  const [requested, setRequested] = React.useState(false);
  const [axonVersion, setAxonVersion] = React.useState("edge");

  const getVersions = async () => {
    const ipcRenderer: IpcRenderer = window.require("electron").ipcRenderer;

    ipcRenderer.on("axon-tags", (event, args: string[]) => {
      setAxonVersions(args);
      setAxonVersion(args[0]);
    });
    ipcRenderer.send("request-tags");
    ipcRenderer.send("request-version");
  };
  if (!requested) {
    getVersions();
    setRequested(true);
    return <CircularProgress />;
  }

  const handleClose = () => {
    setClicked(true);
  };

  const startContainer = async () => {
    const connected = await docker.isConnected();
    if (connected) {
      // setPulling(true);
      setStatus("Pulling Axon image");
      await docker.pullImage(axonVersion);
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

  const stopContainer = async () => {
    if (activeContainer !== null) {
      if ((await activeContainer.inspect()).State.Running) {
        console.log("Stopping container");
        await activeContainer.stop();
      }
    }
  };

  const getButton = (running: boolean) => {
    if (running) {
      return (
        <Tooltip title={<h3>Stop Axon</h3>} placement={"right"}>
          <IconButton onClick={stopContainer}>
            <StopIcon className={classes.start} />
          </IconButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title={<h3>Start Axon in browser</h3>} className={classes.inline}>
          <IconButton onClick={startContainer}>
            <PlayArrow className={classes.start} />
          </IconButton>
        </Tooltip>
      );
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
        <Typography variant="h3">Axon Launcher</Typography>
      </div>
      <div className={classes.centered}>
        <img src={logo} alt={logo} className={classes.logo} />
      </div>
      <div className={classes.centered}>
        <FormControl className={classes.selector}>
          <InputLabel>Axon Version</InputLabel>
          <Select
            value={axonVersion}
            onChange={(event: ChangeEvent<{ value: unknown }>) => setAxonVersion(event.target.value as string)}
          >
            {axonVersions.map((tempversion: string) => {
              return (
                <MenuItem key={tempversion} value={tempversion}>
                  {tempversion}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </div>
      <div className={classes.centered}>
        {getButton(status !== "OFF")}
        <ResetDockerButton docker={docker} disabled={status !== "OFF"} />
      </div>
      {progress}
    </Container>
  );
}
