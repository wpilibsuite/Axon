import * as React from "react";
import { Box, Link, Typography } from "@material-ui/core";
import { ReactElement } from "react";
import { IpcRenderer } from "electron";

function Copyright() {
  const [launcherVersion, setLauncherVersion] = React.useState("Loading");
  const ipcRenderer: IpcRenderer = window.require("electron").ipcRenderer;
  ipcRenderer.on("launcher-version", (event, args: string) => {
    setLauncherVersion(args);
  });
  return (
    <div>
      <Typography variant="body2" color="textSecondary" align="center">
        {"Copyright © "}
        <Link color="inherit" href="https://wpilib.org/">
          WPILib
        </Link>{" "}
        {new Date().getFullYear()}
        {"."}
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center">
        Launcher version: {ipcRenderer.sendSync("launcher-version")}
      </Typography>
    </div>
  );
}

export default function Footer(): ReactElement {
  return (
    <Box pt={4}>
      <Copyright />
    </Box>
  );
}
