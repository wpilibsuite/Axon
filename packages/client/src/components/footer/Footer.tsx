import * as React from "react";
import { Box, Link, Typography } from "@material-ui/core";
import { ReactElement } from "react";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { GetAxonVersionFooter } from "./__generated__/GetAxonVersionFooter";

const GET_AXON_VERSION_QUERY = gql`
  query GetAxonVersionFooter {
    getAxonVersion
  }
`;

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://wpilib.org/">
        WPILib
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

function Version() {
  const versionQuery = useQuery<GetAxonVersionFooter, GetAxonVersionFooter>(GET_AXON_VERSION_QUERY);
  const getVersion = () => {
    if (versionQuery.loading || !versionQuery.data) {
      return "Version Loading";
    }
    return versionQuery.data.getAxonVersion;
  };
  return (
    <Typography variant={"body2"} color={"textSecondary"} align={"center"}>
      Axon Version: {getVersion()}
    </Typography>
  );
}

export default function Footer(): ReactElement {
  return (
    <Box pt={4}>
      <Copyright />
      <Version />
    </Box>
  );
}
