import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography
} from "@material-ui/core";
import { gql, useQuery } from "@apollo/client";
import { GetTests } from "./__generated__/GetTests";
import React from "react";
import { CloudDownload } from "@material-ui/icons";

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

function TestList(props: { exprtID: string }): React.ReactElement {
  const { data, loading, error } = useQuery<GetTests>(GET_TESTS, { variables: { id: props.exprtID } });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined || data.export === undefined) return <p>NO DATA</p>;
  return (
    <List>
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

export default function TestHistory(props: { exprtID: string; handler: () => void }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(true);
    props.handler();
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <MenuItem onClick={handleClick}>
        <Typography variant={"body1"}>Test History</Typography>
      </MenuItem>
      <Dialog onClose={handleClose} open={open}>
        <DialogContent dividers>
          <TestList exprtID={props.exprtID} />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
