import React, { ReactElement } from "react";
import { Container, Divider, IconButton, Paper, Toolbar, Typography } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { IDataset } from "./Datasets";

export interface Props {
  dataset: IDataset;
}

export default function Dataset({ dataset }: Props): ReactElement {
  return (
    <Paper>
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          {dataset.name}
        </Typography>
        <IconButton color="inherit">
          <MoreVertIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <Container>
        <Typography variant="h6">{dataset.imageCount} Image Samples</Typography>
        <Typography variant="h6">Images</Typography>
      </Container>
    </Paper>
  );
}
