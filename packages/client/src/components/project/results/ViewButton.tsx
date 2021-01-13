import { Button, CircularProgress } from "@material-ui/core";
import React, { ReactElement } from "react";

export default function StreamViewer(): ReactElement {
  const [streamLoading, setStreamLoading] = React.useState(true);
  const [tempError, setTempError] = React.useState(false);

  const handleStreamError = () => {
    setTempError(true);
    setTimeout(() => {
      setTempError(false);
    }, 500);
  };

  const handleStreamLoaded = () => {
    setStreamLoading(false);
  };

  if (streamLoading)
    return (
      <>
        <CircularProgress />
        {!tempError && (
          <img
            src={"http://localhost:5000/stream.mjpg"} //<-- so the images dont cache.
            onError={() => handleStreamError()}
            onLoad={() => handleStreamLoaded()}
            alt="no stream"
          />
        )}
      </>
    );
  else
    return (
      <a href="http://localhost:5000/stream.mjpg">
        <Button variant="outlined" color="secondary">
          View
        </Button>
      </a>
    );
}
