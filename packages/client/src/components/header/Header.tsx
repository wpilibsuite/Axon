import * as React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { AppBar, CircularProgress, Toolbar, Typography } from "@material-ui/core";
import { ReactElement } from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { GetAxonVersion } from "./__generated__/GetAxonVersion";

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

const GET_AXON_VERSION_QUERY = gql`
  query GetAxonVersion {
    getAxonVersion
  }
`;
export default function Header(): ReactElement {
  const classes = useStyles();
  const versionQuery = useQuery<GetAxonVersion, GetAxonVersion>(GET_AXON_VERSION_QUERY);
  const getVersion = () => {
    if (versionQuery.loading || !versionQuery.data) {
      return "Version Loading";
    }
    return versionQuery.data.getAxonVersion;
  };

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <Typography variant="h6" color="inherit" noWrap>
          Axon: {getVersion()}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
