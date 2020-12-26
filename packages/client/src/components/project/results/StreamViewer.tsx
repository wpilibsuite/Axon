import React, { ReactElement } from "react";
import { CircularProgress } from "@material-ui/core";

import { Container } from "@material-ui/core";

export default function StreamViewer(): ReactElement {
  const [streamLoading, setStreamLoading] = React.useState(true);
  const [tempError, setTempError] = React.useState(false);
  const [streamTimeout, setStreamTimeout] = React.useState(0);
  const [testError, setTestError] = React.useState(false);

  const handleStreamError = () => {
    setTempError(true);
    setTimeout(() => {
      setTempError(false);
    }, 1000);
    setStreamTimeout(streamTimeout + 1);
    if (streamTimeout > 20) {
      setTestError(true);
      setStreamLoading(false);
    }
  };
  const handleStreamLoaded = () => {
    setStreamLoading(false);
  };
  return (
    <Container>
      {streamLoading && (
        <>
          <CircularProgress />
        </>
      )}
      {!tempError && !testError && (
        <img
          src={`http://localhost:5000/stream.mjpg?dummy=${Math.round(new Date().getTime() / 1000)}`} //<-- so the images dont cache.
          alt="no stream"
          onError={() => handleStreamError()}
          onLoad={() => handleStreamLoaded()}
        />
      )}
      {testError && (
        <>
          <p>There has been an error.</p>
        </>
      )}
    </Container>
  );
}
