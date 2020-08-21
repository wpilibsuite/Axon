import React, { ReactElement } from "react";

import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Tooltip
} from "@material-ui/core";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { DropzoneArea } from "material-ui-dropzone";
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";

const TEST_MODEL_MUTATION = gql`
  mutation testModel($modelExport: ExportInput!, $videoName: String!, $video: Upload!) {
    testModel(modelExport: $modelExport, videoName: $videoName, video: $video) {
      id
    }
  }
`;

export default function TestButton(props: { modelExport: GetProjectData_project_exports }): ReactElement {
  const [testModel] = useMutation(TEST_MODEL_MUTATION);
  const [preparing, setPreparing] = React.useState(false);
  const [videoName, setVideoName] = React.useState("");
  const [video, setVideo] = React.useState<File>();

  const [viewing, setViewing] = React.useState(false);
  const [streamLoading, setStreamLoading] = React.useState(false);
  const [streamError, setStreamError] = React.useState(false);
  const [streamTimeout, setStreamTimeout] = React.useState(0);
  const [testError, setTestError] = React.useState(false);

  const handleClickPrepare = () => {
    setPreparing(true);
  };
  const handleClosePrepare = () => {
    setPreparing(false);
  };
  const handleTest = () => {
    const modelExport = {
      projectId: props.modelExport.projectId,
      name: props.modelExport.name,
      directory: props.modelExport.directory,
      tarPath: props.modelExport.tarPath
    }; //bad request if not this because the queried export has extra typing values
    console.log(modelExport);
    testModel({ variables: { modelExport, videoName, video } }).catch((err) => {
      console.log(err);
    });

    handleClosePrepare();
    setStreamLoading(true);
    handleOpenView();
  };
  const handleOpenView = () => {
    setStreamError(false);
    setTestError(false);
    setStreamTimeout(0);
    setViewing(true);
  };
  const handleCloseView = () => {
    setViewing(false);
  };
  const handleEnd = () => {
    handleCloseView();
    console.log("end"); //remaking the halt container behavior so waiting on this
  };
  const handleStreamError = () => {
    setStreamError(true);
    setTimeout(() => {
      setStreamError(false);
    }, 1000);
    setStreamTimeout(streamTimeout + 1);
    if (streamTimeout > 20) {
      setTestError(true);
      setStreamLoading(false);
    }
    if (!streamLoading && !props.modelExport.testingInProgress) {
      handleEnd();
    }
  };
  const handleStreamLoaded = () => {
    setStreamLoading(false);
  };

  return (
    <>
      <Tooltip title="Test">
        {props.modelExport.testingInProgress ? (
          <IconButton onClick={handleOpenView}>View</IconButton>
        ) : (
          <IconButton onClick={handleClickPrepare}>Test</IconButton>
        )}
      </Tooltip>
      <Dialog onClose={handleClosePrepare} open={preparing}>
        <DialogContent dividers>
          <TextField
            onChange={(event) => setVideoName(event.target.value)}
            autoFocus
            margin="dense"
            label="Video Name"
            fullWidth
          />
          <DropzoneArea
            onChange={(files) => setVideo(files[0] || {})}
            acceptedFiles={["video/*"]}
            filesLimit={1}
            maxFileSize={Infinity}
            showFileNames={true}
            showPreviewsInDropzone={true}
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClosePrepare}>
            Cancel
          </Button>
          {video && (
            <Button autoFocus onClick={handleTest} color="primary">
              Test
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog fullWidth={true} maxWidth="lg" onClose={handleCloseView} open={viewing}>
        <DialogContent dividers>
          <Container>
            {streamLoading && (
              <>
                <p>{`Loading ${streamTimeout}`}</p>
              </>
            )}
            {!streamError && !testError && viewing && (
              <img
                src={`http://localhost:5000/stream.mjpg?dummy=${Math.round(new Date().getTime() / 1000)}`} //<-- so the last image doesnt catch. But I am worried it will catch a million images eventually. The 1000 makes it cache less i think, but slower detection of an ended stream
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
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleEnd}>
            CancelTest
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
