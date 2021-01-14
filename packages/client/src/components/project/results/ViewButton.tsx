import { MenuItem, Typography } from "@material-ui/core";
import React, { ReactElement } from "react";

export default function StreamViewer(props: { handler: () => void }): ReactElement {
  return (
    <MenuItem onClick={props.handler}>
      <a
        href="http://localhost:5000/stream.mjpg"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "inherit",
          textDecoration: "none"
        }}
      >
        <Typography variant="body1">View</Typography>
      </a>
    </MenuItem>
  );
}
