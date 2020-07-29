import { Button, Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement } from "react";
import { gql, useMutation } from "@apollo/client";
import { StartTraining, StartTrainingVariables } from "./__generated__/StartTraining";

const START_TRAINING = gql`
  mutation StartTraining($id: ID!) {
    startTraining(id: $id) {
      id
    }
  }
`;

export default function Input(props: { id: string }): ReactElement {
  const [startTraining] = useMutation<StartTraining, StartTrainingVariables>(START_TRAINING);

  return (
    <Container>
      <Datasets id={props.id} />
      <Divider />
      <Parameters id={props.id} />
      <Divider />
      <Button onClick={() => startTraining({ variables: { id: props.id } })}>Start</Button>
    </Container>
  );
}
