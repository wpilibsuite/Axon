import { Button, Dialog, DialogActions, DialogContent, IconButton, TextField } from "@material-ui/core";
import { DropzoneArea } from "material-ui-dropzone";
import { useMutation } from "@apollo/client";
import AddIcon from "@material-ui/icons/Add";
import React, { ReactElement } from "react";
import gql from "graphql-tag";

const SAVE_VID_MUTATION = gql`
  mutation saveVideo($projectID: ID!, $name: String!, $video: Upload!) {
    saveVideo(projectID: $projectID, name: $name, video: $video) {
      id
    }
  }
`;

export default function VideoUploadButton(props: { id: string }): ReactElement {
  const [saveVideoMutation] = useMutation(SAVE_VID_MUTATION);
  const [video, setVideo] = React.useState<File>();
  const [name, setName] = React.useState<string>();
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    const projectID = props.id;
    saveVideoMutation({ variables: { projectID, name, video } }).catch((err) => {
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
            onChange={(event) => setName(event.target.value)}
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
