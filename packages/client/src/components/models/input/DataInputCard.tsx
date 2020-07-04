import * as React from "react";
import { Button, Card, CardActions, CardContent, Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  root: {
    minWidth: 275
  },
  title: {
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  }
});

type CardProps = {
  title: string;
};

export default function DataInputCard({ title }: CardProps) {
  const classes = useStyles();

  return (
    <Grid item xs={12} md={4} lg={4}>
      <Card className={classes.root} variant="outlined">
        <CardContent>
          <Typography className={classes.title} color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" component="h2">
            --
          </Typography>
          <Typography variant="body2" component="p">
            Items
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small">Choose</Button>
        </CardActions>
      </Card>
    </Grid>
  );
}
