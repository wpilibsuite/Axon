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

export default function Launch(): ReactElement {
  const classes = useStyles();
  const [pulling, setPulling] = React.useState<boolean>(false);
  const [containerReady, setContainerReady] = React.useState<boolean>(false);
  const [container, setContainer] = React.useState<null | Dockerode.Container>(null);

  const startContainer = () => {
    docker.isImageReady().then((value) => {
      // image not yet downloaded
      if (!value) {
        // Pull image
        setPulling(true);
        console.log("Pulling Axon image");
        docker.pullImage().then(() => {
          setPulling(false);
          console.log("Finished pulling.");
        });
      } else {
        console.log("Image exists.");
        setPulling(false);
        // image downloaded
        docker.isContainerReady().then((value) => {
          setContainerReady(value);
          if (!value) {
            console.log("Creating container");
            docker.createContainer().then((container) => {
              setContainer(container);
              setContainerReady(true);
              console.log("Container created.");
              console.log("Running container");
              docker.runContainer(container);
            });
          } else {
            console.log("Container exists.");
            docker.getContainer().then((container) => {
              console.log("Running container");
              docker.runContainer(container);
            });
          }
        });
      }
    });
  };

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
      </Grid>
    </Container>
  );
}
