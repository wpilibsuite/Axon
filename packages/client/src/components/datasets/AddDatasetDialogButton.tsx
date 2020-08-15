import React, { ReactElement } from "react";
import { CircularProgress, IconButton, Tooltip } from "@material-ui/core";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";
import AddIcon from "@material-ui/icons/Add";

const CREATE_DATASET_MUTATION = gql`
  mutation CreateDataset($file: Upload!) {
    createDataset(upload: $file) {
      id
    }
  }
`;

export default function AddDatasetDialogButton(): ReactElement {
  const [uploading, setUploading] = React.useState(false);
  const [uploadDataset] = useMutation(CREATE_DATASET_MUTATION);
  const apolloClient = useApolloClient();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.validity.valid && e.target.files?.[0]) {
      setUploading(true);
      await uploadDataset({ variables: { file: e.target.files[0] } });
      await apolloClient.resetStore();
      setUploading(false);
    }
  };

  if (uploading) {
    return <CircularProgress />;
  }

  return (
    <Tooltip title="Add dataset">
      <IconButton component="label">
        <AddIcon />
        <input type="file" style={{ display: "none" }} required onChange={onChange} key={Date.now()} />
      </IconButton>
    </Tooltip>
  );
}
