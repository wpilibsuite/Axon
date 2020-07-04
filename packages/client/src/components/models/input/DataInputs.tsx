import * as React from "react";
import { Grid } from "@material-ui/core";
import DataInputCard from "./DataInputCard";
import Section from "../Section";

export default function DataInputs() {
  return (
    <Section title="Data Inputs">
      <Grid container spacing={3}>
        <DataInputCard title="Training Data" />
        <DataInputCard title="Validation Data" />
        <DataInputCard title="Testing Data" />
      </Grid>
    </Section>
  );
}
