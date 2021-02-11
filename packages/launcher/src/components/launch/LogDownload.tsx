import React, { ReactElement } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Button, Container, Grid, IconButton, ListItem, Tooltip, Typography } from "@material-ui/core";
import path from "path";
import { GetApp } from "@material-ui/icons";

const fs = window.require("fs");
const browser = window.require("browser");
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

export default function LogDownload(): ReactElement {
  const classes = useStyles();

  const logFilePath = window.require("electron-log").transports.file.getFile().path;

  const onClick = () => {
    fs.readFile(logFilePath, "utf-8", (err: NodeJS.ErrnoException | null, data: string) => {
      if (err) {
        alert("An error ocurred reading the file :" + err.message);
        return;
      }
      if (!data) data = "Axon not run.";
      fs.writeFile("./public/axon.log", data, function (err: NodeJS.ErrnoException | null) {
        if (err) throw err;
        console.log("Saved!");
      });
    });
  };

  return (
    <a
      href={`http://localhost:2000/axon.log`}
      style={{
        color: "inherit",
        textDecoration: "none"
      }}
      onClick={onClick}
      download
    >
      <IconButton>
        <GetApp className={classes.start} />
      </IconButton>
    </a>
  );
}
