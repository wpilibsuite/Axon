import React, { ReactElement } from "react";
import { Button, CircularProgress, Typography } from "@material-ui/core";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";
import AddIcon from "@material-ui/icons/Add";
import { TreeItem } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingTop: 10,
    paddingLeft: 10
  },
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
  },
  labelRoot: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 0)
  },
  labelIcon: {
    marginRight: theme.spacing(1)
  },
  labelText: {
    fontWeight: "inherit",
    flexGrow: 1
  },
  button: {
    textTransform: "none"
  }
}));

const CREATE_DATASET_MUTATION = gql`
  mutation AddDataset($file: Upload!) {
    createDataset(upload: $file) {
      id
    }
  }
`;

export default function UploadDatasetDialogButton(): ReactElement {
  const classes = useStyles();
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
    <TreeItem
      nodeId={"uploadbuttondataset"}
      label={
        <Button component={"label"} className={classes.button}>
          <div className={classes.labelRoot}>
            {React.createElement(AddIcon, { className: classes.labelIcon })}
            <input type="file" style={{ display: "none" }} required onChange={onChange} key={Date.now()} />
            <Typography variant={"body1"}> Upload Dataset</Typography>
          </div>
        </Button>
      }
    />
  );
}
