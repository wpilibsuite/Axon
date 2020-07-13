import * as React from "react";
import { TextField } from "@material-ui/core";
import Section from "../Section";
import { ReactElement } from "react";

export default function Parameters(): ReactElement {
  return (
    <Section title="Parameters">
      <form>
        <TextField id="outlined-basic" label="Maximum Iterations" variant="outlined" type="number" />
      </form>
    </Section>
  );
}
