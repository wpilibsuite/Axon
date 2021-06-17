import * as React from "react";
import { ReactElement } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { TreeItem } from "@material-ui/lab";
import gql from "graphql-tag";
import { Settings } from "@material-ui/icons";
import { useApolloClient, useMutation } from "@apollo/client";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingTop: 10,
    paddingLeft: 10
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
  labelName: {
    wordWrap: "break-word",
    maxWidth: 100
  }
}));

const RESET_VOLUME_MUTATION = gql`
  mutation ResetVolume {
    resetVolume
  }
`;

type ProjectListProps = {
  nodeId: string;
};

export default function SettingsDialogButton({ nodeId }: ProjectListProps): ReactElement {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [resetVolume] = useMutation(RESET_VOLUME_MUTATION);
  const apolloClient = useApolloClient();

  const handleReset = () => {
    resetVolume().then(async (r) => {
      await apolloClient.resetStore();
    });
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography>Delete all user data (datasets, projects, exports, tests, etc.)</Typography>
          <Button variant={"contained"} style={{ color: "#ff0000" }} onClick={handleReset}>
            Delete
          </Button>
        </DialogContent>
        <DialogActions>
          <Button variant={"contained"} onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <TreeItem
        nodeId={nodeId}
        className={classes.item}
        label={
          <div className={classes.labelRoot} onClick={() => setOpen(true)}>
            {React.createElement(Settings, { className: classes.labelIcon })}
            <Typography variant={"body1"} className={classes.labelName}>
              Settings
            </Typography>
          </div>
        }
      />
    </>
  );
}
