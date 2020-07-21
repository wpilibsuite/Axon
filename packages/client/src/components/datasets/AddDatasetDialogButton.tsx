import React, { ReactElement } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from "@material-ui/core";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";
import AddIcon from "@material-ui/icons/Add";
import { DropzoneArea } from "material-ui-dropzone";

const CREATE_DATASET_MUTATION = gql`
  mutation CreateDataset($file: Upload!) {
    createDataset(upload: $file) {
      id
    }
  }
`;

export default function AddDatasetDialogButton(): ReactElement {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File>();
  const [uploadDataset] = useMutation(CREATE_DATASET_MUTATION);
  const apolloClient = useApolloClient();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleAdd = () => {
    uploadDataset({ variables: { file } }).then(() => {
      apolloClient.resetStore();
    });
    handleClose();
  };

  return (
    <>
      <Tooltip title="Add dataset">
        <IconButton onClick={handleClickOpen}>
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Add dataset</DialogTitle>
        <DialogContent dividers>
          <DropzoneArea
            onChange={(files) => setFile(files[0] || {})}
            acceptedFiles={["application/x-tar"]}
            filesLimit={1}
            maxFileSize={Infinity}
            showFileNames={true}
            showPreviewsInDropzone={true}
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus onClick={handleAdd} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
