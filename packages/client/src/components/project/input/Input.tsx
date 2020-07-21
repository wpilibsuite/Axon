import { Container, Divider } from "@material-ui/core";
import Datasets from "./Datasets";
import Parameters from "./Parameters";
import React, { ReactElement } from "react";

export default function Input(): ReactElement {
  return (
    <Container>
      <Datasets />
      <Divider />
      <Parameters />
    </Container>
  );
}
