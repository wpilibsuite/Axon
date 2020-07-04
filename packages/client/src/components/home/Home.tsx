import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Container, Grid, Paper, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  }
}));

function ProjectInfo() {
  return (
    <>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        Project info
      </Typography>
      <Typography component="p" variant="h6">
        2020-Power Cells
      </Typography>
      <Typography color="textSecondary">Object Detection</Typography>
    </>
  );
}

export default function Home() {
  const classes = useStyles();

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={6}>
          <Paper className={classes.paper}>
            <ProjectInfo />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
