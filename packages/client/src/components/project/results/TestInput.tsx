import { Button, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip } from "@material-ui/core";
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";
import { gql, useMutation, useQuery } from "@apollo/client";
import { GetVideos } from "./__generated__/GetVideos";
import VideoUploadButton from "./VideoUploadButton";
import React, { ChangeEvent } from "react";
type Export = GetProjectData_project_exports;

const TEST_MODEL_MUTATION = gql`
  mutation startTest($name: String!, $projectID: String!, $exportID: String!, $videoID: String!) {
    testModel(name: $name, projectID: $projectID, exportID: $exportID, videoID: $videoID) {
      id
    }
  }
`;

export default function TestInput(props: {
  exprt: Export;
  active: boolean;
  setActive: (active: boolean) => void;
}): React.ReactElement {
  const [testModel] = useMutation(TEST_MODEL_MUTATION);
  const [name, setName] = React.useState<string>(`${props.exprt.name}-test`);
  const [videoID, setVideoID] = React.useState<string>();

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const handleVideoChange = (event: ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
    setVideoID(event.target.value as string);
  };
  const handleTest = () => {
    const projectID = props.exprt.projectID;
    const exportID = props.exprt.id;
    testModel({ variables: { name, projectID, exportID, videoID } }).catch((err) => {
      console.log(err);
    });
    props.setActive(true);
  };

  let tooltipMessage = `Run inference on ${props.exprt.name}.`;
  if (!videoID) tooltipMessage = "Select a video to test with.";
  if (props.active) tooltipMessage = "Test already in progress.";

  return (
    <FormControl fullWidth>
      <FormControl style={{ width: "100%" }}>
        <VideoSelect id={props.exprt.projectID} onSelect={handleVideoChange} />
      </FormControl>
      <FormControl style={{ width: "100%" }}>
        <TextField margin={"normal"} variant="outlined" value={name} onChange={handleNameChange} />
      </FormControl>
      <FormControl style={{ width: "40%", display: "flex", justifyContent: "center" }}>
        <Tooltip title={tooltipMessage}>
          <span>
            <Button variant="outlined" color="primary" onClick={handleTest} disabled={!videoID || props.active}>
              Test
            </Button>
          </span>
        </Tooltip>
      </FormControl>
    </FormControl>
  );
}

const GET_VIDEOS = gql`
  query GetVideos($id: ID!) {
    project(id: $id) {
      videos {
        id
        name
        filename
        fullPath
      }
    }
  }
`;

function VideoSelect(props: {
  id: string;
  onSelect: (event: ChangeEvent<{ name?: string | undefined; value: unknown }>) => void;
}): React.ReactElement {
  const { data, loading, error } = useQuery<GetVideos>(GET_VIDEOS, {
    variables: {
      id: props.id
    },
    pollInterval: 2000
  });

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>{error?.message}</p>;
  if (data.project === null) return <p>NOPROJECT</p>;

  return (
    <>
      <InputLabel>Select Video</InputLabel>
      <Select variant="outlined" onChange={props.onSelect}>
        {data.project?.videos.map((video) => (
          <MenuItem value={video.id} key={video.id}>{video.name}</MenuItem>
        ))}
        <VideoUploadButton id={props.id} />
      </Select>
    </>
  );
}
