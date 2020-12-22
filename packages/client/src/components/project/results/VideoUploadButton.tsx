import React, { ReactElement } from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { Button, Dialog, DialogActions, DialogContent, IconButton, TextField } from "@material-ui/core";
import { DropzoneArea } from "material-ui-dropzone";
import AddIcon from "@material-ui/icons/Add";

const SAVE_VID_MUTATION = gql`
  mutation saveVideo($projectId: ID!, $videoName: String!, $video: Upload!) {
    saveVideo(projectId: $projectId, videoName: $videoName, video: $video) {
      id
    }
  }
`;

export default function VideoUploadButton(props: { id: string }): ReactElement {
  const [saveVideoMutation] = useMutation(SAVE_VID_MUTATION);
  const [video, setVideo] = React.useState<File>();
  const [videoName, setVideoName] = React.useState<string>();
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    const projectId = props.id;
    saveVideoMutation({ variables: { projectId, videoName, video } }).catch((err) => {
      console.log(err);
    });
    handleClose();
  };

  return (
    <>
      <IconButton autoFocus onClick={handleClick} color="primary">
        <AddIcon />
      </IconButton>
      <Dialog onClose={handleClose} open={open}>
        <DialogContent dividers>
          <DropzoneArea
            onChange={(files) => setVideo(files[0] || {})}
            acceptedFiles={["video/*"]}
            filesLimit={1}
            maxFileSize={Infinity}
            showFileNames={true}
            showPreviewsInDropzone={true}
          />
          <TextField
            onChange={(event) => setVideoName(event.target.value)}
            autoFocus
            margin="dense"
            label="Video Name"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
