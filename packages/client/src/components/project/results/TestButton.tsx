import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Collapse
} from "@material-ui/core";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import { GetDockerState } from "../../trainerStatus/__generated__/GetDockerState";
import { GET_DOCKER_STATE } from "../../trainerStatus/TrainerStatus";
import { DockerState } from "../../../__generated__/globalTypes";
import React, { ReactElement, ChangeEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import VideoUploadButton from "./VideoUploadButton";
import gql from "graphql-tag";

const TEST_MODEL_MUTATION = gql`
  mutation testModel($name: String!, $projectID: String!, $exportID: String!, $videoID: String!) {
    testModel(name: $name, projectID: $projectID, exportID: $exportID, videoID: $videoID) {
      id
    }
  }
`;

export default function TestButton(props: {
  active: boolean;
  modelExport: GetProjectData_project_exports;
  videos: GetProjectData_project_videos[];
}): ReactElement {
  const [preparing, setPreparing] = React.useState(false);
  const [videoID, setVideoID] = React.useState<string>();
  const [testModel] = useMutation(TEST_MODEL_MUTATION);
  const [name, setName] = React.useState<string>();

  const handleTest = async () => {
    const projectID = props.modelExport.projectID;
    const exportID = props.modelExport.id;
    await testModel({ variables: { name, projectID, exportID, videoID } }).catch((err) => {
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
    setName(event.target.value);
  };

  const { data, loading, error } = useQuery<GetDockerState>(GET_DOCKER_STATE, { pollInterval: 5000 });
  if (loading) return <p>connecting to tester</p>;
  if (error) return <p>cant connect to tester</p>;
  if (data?.dockerState !== DockerState.READY) return <p>no test image yet</p>;

  return (
    <>
      <Collapse in={!props.active}>
        <Button variant="outlined" color="primary" onClick={handleClickPrepare}>
          Test
        </Button>
      </Collapse>
      <Dialog onClose={handleClosePrepare} open={preparing}>
        <DialogContent dividers>
          <p>Video to test: </p>

          <RadioGroup onChange={handleVideoChange}>
            {props.videos.map((video) => (
              <FormControlLabel key={video.id} value={video.id} control={<Radio />} label={video.name} />
            ))}
          </RadioGroup>

          <VideoUploadButton id={props.modelExport.projectID} />

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
