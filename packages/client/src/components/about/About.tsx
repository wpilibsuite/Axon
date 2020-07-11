import React from "react";
import { Button, Typography } from "@material-ui/core";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

const START_PROJECT = gql`
  mutation StartProject {
    startTraining(id: "abc") {
      id
    }
  }
`;

export default function About() {
  const [startTraining, { data }] = useMutation(START_PROJECT);

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
      <Button onClick={() => startTraining({ variables: { id: "abc" } })}>Start</Button>
    </>
  );
}
