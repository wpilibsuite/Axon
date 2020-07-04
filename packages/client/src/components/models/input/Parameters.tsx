import * as React from "react";
import { TextField } from "@material-ui/core";
import Section from "../Section";

export default function Parameters() {
  return (
    <Section title="Parameters">
      <form>
        <TextField id="outlined-basic" label="Maximum Iterations" variant="outlined" type="number" />
      </form>
    </Section>
  );
}
