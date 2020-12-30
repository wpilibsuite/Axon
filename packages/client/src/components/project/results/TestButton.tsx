import React, { ReactElement, ChangeEvent } from "react";

import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Tooltip,
  Collapse
} from "@material-ui/core";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import VideoUploadButton from "./VideoUploadButton";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GET_DOCKER_STATE } from "../../trainerStatus/TrainerStatus";
import { GetDockerState } from "../../trainerStatus/__generated__/GetDockerState";
import { DockerState } from "../../../__generated__/globalTypes";

const TEST_MODEL_MUTATION = gql`
  mutation testModel($testName: String!, $projectID: String!, $exportID: String!, $videoID: String!) {
    testModel(testName: $testName, projectID: $projectID, exportID: $exportID, videoID: $videoID) {
      id
    }
  }
`;

export default function TestButton(props: {
  active: boolean;
  modelExport: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
}): ReactElement {
  const [testModel] = useMutation(TEST_MODEL_MUTATION);
  const [preparing, setPreparing] = React.useState(false);
  const [videoID, setVideoID] = React.useState<string>();
  const [testName, setTestName] = React.useState<string>();

  const handleTest = async () => {
    const projectID = props.modelExport.projectId;
    const exportID = props.modelExport.id;
    await testModel({ variables: { testName, projectID, exportID, videoID } }).catch((err) => {
      console.log(err);
    });
    handleClosePrepare();
  };
  const handleClickPrepare = () => {
    setPreparing(true);
  };
  const handleClosePrepare = () => {
    setPreparing(false);
  };
  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideoID(event.target.value);
  };
  const handleTestNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTestName(event.target.value);
  };

  const { data, loading, error } = useQuery<GetDockerState>(GET_DOCKER_STATE, { pollInterval: 5000 });
  if (loading) return <p>connecting to tester</p>;
  if (error) return <p>cant connect to tester</p>;
  if (data?.dockerState !== DockerState.READY) return <p>no test image yet</p>;

  return (
    <>
      <Collapse in={!props.active}>
        <Tooltip title="Test">
          <IconButton onClick={handleClickPrepare}>Test</IconButton>
        </Tooltip>
      </Collapse>
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
    </>
  );
}
