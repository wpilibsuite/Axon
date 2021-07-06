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
  progress: {
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "50%"
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
  const [internetConnection, setInternetConnection] = React.useState(false);
  const [checkedInternetConnection, setCheckedInternetConnection] = React.useState(false);
  const [hasImages, setHasImages] = React.useState(true);
  const [clickedImageDialog, setClickedImageDialog] = React.useState(false);

  const getVersions = async () => {
    const ipcRenderer: IpcRenderer = window.require("electron").ipcRenderer;

    await ipcRenderer.on("axon-tags", (event, args: string[]) => {
      setAxonVersions(args);
      setAxonVersion(args[0]);
    });
    ipcRenderer.send("request-tags");
    ipcRenderer.send("request-version");
  };
  const getTagsFromSystem = async () => {
    const connected = await docker.isConnected();
    if(connected) {
      const images = await docker.getImages();
      if (images !== null && images.length > 0) {
        let imageMap = new Map();
        for (let i = 0; i < images.length; i++) {
          let tmpTag = images[i].RepoTags[0].split(":")[1];
          if (imageMap.has(tmpTag)) {
            imageMap.set(tmpTag, imageMap.get(tmpTag) + 1);
          } else {
            imageMap.set(tmpTag, 1);
          }
        }
        const tmpTags: string[] = [];
        imageMap.forEach((value: number, key: string) => {
          if (value >= 7) tmpTags.push(key);
        });
        console.log(tmpTags);
        setAxonVersions(tmpTags);
        setAxonVersion(tmpTags[0]);
      }
    }
  };
  const getInternetConnection = async () => {
    const ipcRenderer: IpcRenderer = window.require("electron").ipcRenderer;
    await ipcRenderer.on("internet-status", (event, arg: boolean) => {
      setInternetConnection(arg);
      setCheckedInternetConnection(true);
      if (!arg) {
        // need to look for own tags
        getTagsFromSystem();
      }
    });
    ipcRenderer.send("request-internet");
  };

  if (!requested) {
    getVersions();
    setRequested(true);
    return <CircularProgress />;
  }

  if (!checkedInternetConnection) {
    getInternetConnection();
    return <CircularProgress className={classes.progress} />;
  }

  const handleClose = () => {
    setClicked(true);
  };

  const handleImageDialogClose = () => {
    setClickedImageDialog(true);
  };

  const startContainer = async () => {
    const connected = await docker.isConnected();
    if (connected) {
      if (internetConnection) {
        console.log("Valid Internet Connection");
        setStatus("Pulling Axon image");
        await docker.pullImage(axonVersion);
        // setPulling(false);
        setStatus("Finished pulling.");
        setHasImages(true);
      } else {
        console.log("No Internet Connection Detected, Skipping Pulling Images");
        const images = await docker.getImages();
        if (images !== null && images.length > 0) {
          let count = 0;
          for (let i = 0; i < images.length; i++) {
            if (axonVersion === images[i].RepoTags[0].substring(images[i].RepoTags[0].length - axonVersion.length)) {
              count++;
              console.log(images[i].RepoTags[0]);
            }
          }
          if (count >= 7) {
            // more than seven images w/ the correct tag
            console.log("Proceeding with previously pulled container");
            setHasImages(true);
          } else {
            console.log("No Internet Connected and the Selected images have not been found");
            setHasImages(false);
            setClickedImageDialog(false);
            return;
          }
          // also check go through the list to see if they match the version
        } else {
          console.log("No Internet Connected and the Selected images have not been found");
          setHasImages(false);
          setClickedImageDialog(false);
          return;
        }
      }

      // image downloaded
      const containers = await docker.getContainers();
      if (containers !== null && containers.length > 0) {
        setStatus("Removing old containers");
        await docker.reset();
      }
      setStatus("Creating container");
      const container = await docker.createContainer(axonVersion);
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
      <Dialog open={!hasImages && !clickedImageDialog} onClose={handleImageDialogClose}>
        <DialogTitle>{"Issue Pulling Images"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Axon had trouble pulling the images for the selected version. Either select a version that you have run
            before, or connect to the internet to pull the required images.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImageDialogClose}>Cancel</Button>
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
