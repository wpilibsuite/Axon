import { Button } from "@material-ui/core";
import React, { ReactElement } from "react";

export default function StreamViewer(): ReactElement {
  return (
    <a href="http://localhost:5000/stream.mjpg" target="_blank">
      <Button variant="outlined" color="secondary">
        View
      </Button>
    </a>
  );
}
