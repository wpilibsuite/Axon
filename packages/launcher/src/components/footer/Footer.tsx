import * as React from "react";
import { Box, Link, Typography } from "@material-ui/core";
import { ReactElement } from "react";

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://wpilib.org/">
        WPILib
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

export default function Footer(): ReactElement {
  return (
    <Box pt={4}>
      <Copyright />
    </Box>
  );
}
