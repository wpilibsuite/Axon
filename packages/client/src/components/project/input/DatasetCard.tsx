import React, { ReactElement } from "react";
import { Card, CardHeader, CardMedia, Checkbox, createStyles, Theme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { GetDatasets_datasets } from "./__generated__/GetDatasets";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: 345
    },
    media: {
      height: 0,
      paddingTop: "75%" // 4:3
    }
  })
);

export function DatasetCard(props: { dataset: GetDatasets_datasets }): ReactElement {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardHeader
        action={<Checkbox />}
        title={props.dataset.name}
        subheader={`${props.dataset.images.length} images`}
      />
      <CardMedia
        className={classes.media}
        image={encodeURI(`http://localhost:4000/${props.dataset.images[0].path.replace("data/datasets", "dataset")}`)}
      />
    </Card>
  );
}
