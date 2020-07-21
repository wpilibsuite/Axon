import React from "react";
import { createStyles, TextField, Theme } from "@material-ui/core";
import Section from "../Section";
import { ReactElement } from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      "& .MuiTextField-root": {
        margin: theme.spacing(1),
        width: "25ch"
      }
    }
  })
);

export default function Parameters(): ReactElement {
  const classes = useStyles();

  return (
    <Section title="Parameters">
      <form className={classes.root}>
        <TextField label="Epochs" variant="outlined" type="number" />
        <TextField label="Batch size" variant="outlined" type="number" />
        <TextField label="Learning rate" variant="outlined" type="number" />
      </form>
    </Section>
  );
}
