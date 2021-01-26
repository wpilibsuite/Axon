import React, { ReactElement } from "react";
import { Container, IconButton, Typography } from "@material-ui/core";
import logo from "assets/logo.png";
import { PlayArrow } from "@material-ui/icons";

export default function About(): ReactElement {
  return (
    <Container>
      <Typography variant="h3" gutterBottom>
        Axon Launcher
      </Typography>
      <img src={logo} alt={logo} />
      <IconButton>
        <PlayArrow />
      </IconButton>
    </Container>
  );
}
