import { Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement } from "react";

export default function Input(props: { id: string }): ReactElement {
  return (
    <Container>
      <Datasets id={props.id} />
      <Divider />
      <Parameters id={props.id} />
    </Container>
  );
}
