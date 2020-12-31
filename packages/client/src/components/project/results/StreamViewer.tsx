import { CircularProgress } from "@material-ui/core";
import { Container } from "@material-ui/core";
import React, { ReactElement } from "react";

export default function StreamViewer(props: { port: string }): ReactElement {
  const [streamLoading, setStreamLoading] = React.useState(true);
  const [streamTimeout, setStreamTimeout] = React.useState(0);
  const [testError, setTestError] = React.useState(false);
  const [tempError, setTempError] = React.useState(false);

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
          src={`http://localhost:${props.port}/stream.mjpg?dummy=${Math.round(new Date().getTime() / 1000)}`} //<-- so the images dont cache.
          onError={() => handleStreamError()}
          onLoad={() => handleStreamLoaded()}
          alt="no stream"
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
