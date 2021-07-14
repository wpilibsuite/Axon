import { Button, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip } from "@material-ui/core";
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";
import { gql, useMutation, useQuery } from "@apollo/client";
import { GetVideos } from "./__generated__/GetVideos";
import VideoUploadButton from "./VideoUploadButton";
import React from "react";
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
  const handleVideoChange = (id: unknown) => {
    setVideoID(id as string);
    console.log(("video id changed to " + id) as string);
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
    <div>
      <FormControl fullWidth>
        <FormControl style={{ width: "100%" }}>
          <VideoSelect
            selected={videoID === undefined ? "" : videoID}
            id={props.exprt.projectID}
            onSelect={handleVideoChange}
          />
        </FormControl>
        <FormControl style={{ width: "100%" }}>
          <TextField margin={"normal"} variant="outlined" value={name} onChange={handleNameChange} />
        </FormControl>
        <FormControl style={{ width: "40%", display: "flex", justifyContent: "center" }}>
          <Tooltip title={tooltipMessage}>
            <span>
              <Button variant="contained" color="primary" onClick={handleTest} disabled={props.active || !videoID}>
                Test
              </Button>
            </span>
          </Tooltip>
        </FormControl>
      </FormControl>
    </div>
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

function VideoSelect(props: { id: string; onSelect: (event: unknown) => void; selected: string }): React.ReactElement {
  const { data, loading, error } = useQuery<GetVideos>(GET_VIDEOS, {
    variables: {
      id: props.id
    },
    pollInterval: 2000
  });

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>{error?.message}</p>;
  if (data.project === null) return <p>NO PROJECT</p>;
  if (props.selected === "" && data.project.videos.length > 0) {
    console.log("Setting default");
    props.selected = data.project?.videos[0].id;
    props.onSelect(data.project?.videos[0].id);
  }

  return (
    <>
      <InputLabel style={{ paddingLeft: "10px" }}>Select Video</InputLabel>
      <Select value={props.selected} variant="outlined" onChange={(event) => props.onSelect(event.target.value)}>
        {data.project?.videos.map((video) => (
          <MenuItem value={video.id} key={video.id}>
            {video.name}
          </MenuItem>
        ))}
        <VideoUploadButton id={props.id} />
      </Select>
    </>
  );
}
