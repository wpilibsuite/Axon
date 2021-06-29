import { Button, Dialog, DialogActions, DialogContent, IconButton } from "@material-ui/core";
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

  const handleChange = (files: File[]) => {
    setVideo(files[0] || {});
    const video = files[0];
    if (video) {
      setName(video.name);
    }
  };

  return (
    <>
      <IconButton autoFocus onClick={handleClick} color="primary">
        <AddIcon />
      </IconButton>
      <Dialog onClose={handleClose} open={open}>
        <DialogContent dividers>
          <DropzoneArea
            onChange={handleChange}
            acceptedFiles={["video/*"]}
            filesLimit={1}
            maxFileSize={Infinity}
            showFileNames={true}
            showPreviewsInDropzone={true}
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant={"contained"} onClick={handleClose}>
            Cancel
          </Button>
          <Button variant={"contained"} onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
