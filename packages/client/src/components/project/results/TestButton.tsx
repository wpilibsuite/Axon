import React, { ReactElement, ChangeEvent } from "react";

import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
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
import VideoUploadButton from "./VideoUploadButton";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";

const TEST_MODEL_MUTATION = gql`
  mutation testModel($testName: String!, $projectID: String!, $exportID: String!, $videoID: String!) {
    testModel(testName: $testName, projectID: $projectID, exportID: $exportID, videoID: $videoID) {
      id
    }
  }
`;

export default function TestButton(props: {
  modelExport: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
}): ReactElement {
  const [testModel] = useMutation(TEST_MODEL_MUTATION);
  const [preparing, setPreparing] = React.useState(false);
  const [videoID, setVideoID] = React.useState<string>();
  const [testName, setTestName] = React.useState<string>();

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
  const handleTest = async () => {
    const projectID = props.modelExport.projectId;
    const exportID = props.modelExport.id;

    console.log(testName);
    console.log(projectID);
    console.log(exportID);
    console.log(videoID);

    await testModel({ variables: { testName, projectID, exportID, videoID } }).catch((err) => {
      console.log(err);
    });

    handleClosePrepare();
    setStreamLoading(true);
    handleOpenView();
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideoID(event.target.value);
  };
  const handleTestNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTestName(event.target.value);
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
  };
  const handleStreamLoaded = () => {
    setStreamLoading(false);
  };

  return (
    <>
      <Tooltip title="Test">
        <IconButton onClick={handleClickPrepare}>Test</IconButton>
      </Tooltip>

      <Dialog onClose={handleClosePrepare} open={preparing}>
        <DialogContent dividers>
          <p>Video to test: </p>

          <RadioGroup onChange={handleVideoChange}>
            {props.videos.map((video) => (
              <FormControlLabel key={video.id} value={video.id} control={<Radio />} label={video.name} />
            ))}
          </RadioGroup>

          <VideoUploadButton id={props.modelExport.projectId} />

          <TextField onChange={handleTestNameChange} autoFocus margin="dense" label="Test Name" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClosePrepare}>
            Cancel
          </Button>

          {videoID && (
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
