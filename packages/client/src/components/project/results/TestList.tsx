import { List, ListItem, ListItemIcon, ListItemText, Typography } from "@material-ui/core";
import { GetTests } from "./__generated__/GetTests";
import { CloudDownload } from "@material-ui/icons";
import { gql, useQuery } from "@apollo/client";
import React from "react";

const GET_TESTS = gql`
  query GetTests($id: ID!) {
    export(id: $id) {
      tests {
        name
        downloadPath
      }
    }
  }
`;

export default function TestList(props: { exprtID: string }): React.ReactElement {
  const { data, loading, error } = useQuery<GetTests>(GET_TESTS, {
    variables: { id: props.exprtID },
    pollInterval: 1000
  });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined || data.export === undefined) return <p>NO DATA</p>;
  if (data.export?.tests?.length === 0) return <Typography> Nothing here yet. </Typography>;
  return (
    <List style={{ minWidth: 400, maxHeight: '250px', overflow: 'auto' }}>
      {data.export?.tests?.map((test) => (
        <ListItem>
          <a download href={`http://localhost:4000/${test.downloadPath}`}>
            <ListItemIcon>
              <CloudDownload />
            </ListItemIcon>
          </a>
          <ListItemText>{test.name}</ListItemText>
        </ListItem>
      ))}
    </List>
  );
}
