import React from "react";
import { Typography } from "@material-ui/core";

export default function About() {
  return (
    <>
      <Typography variant="h3" gutterBottom>
        About
      </Typography>
      <Typography variant="body1" gutterBottom>
        Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000
        years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from
        a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source.
      </Typography>
    </>
  );
}
