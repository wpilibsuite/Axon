import React from "react";
import clsx from "clsx";
import { Card, CardActions, CardContent, CardHeader, CardMedia, Checkbox, Collapse, createStyles, IconButton, Theme, Typography } from "@material-ui/core";
import { GetDatasets_datasets } from "./__generated__/GetDatasets";
import { makeStyles } from "@material-ui/core/styles";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: 345
    },
    media: {
      height: 0,
      paddingTop: "75%" // 4:3
    },
    expand: {
      transform: "rotate(0deg)",
      marginLeft: "auto",
      transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest
      })
    },
    expandOpen: {
      transform: "rotate(180deg)"
    }
  })
);

export default function DatasetCard(props: { dataset: GetDatasets_datasets }) {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={classes.root}>
      <CardHeader action={<Checkbox />} title={props.dataset.name} subheader={`${props.dataset.images.length} images`} />
      <CardMedia className={classes.media} image={encodeURI(`http://localhost:4000/${props.dataset.images[0].path.replace("data/datasets", "dataset")}`)} />
      <CardActions disableSpacing>
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>Method:</Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
}
