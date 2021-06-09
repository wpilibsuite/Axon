import React, { ReactElement } from "react";

export default function About(): ReactElement {
  return (
    <iframe
      height="100%"
      title="docs"
      width="100%"
      src="https://docs.wpilib.org/en/latest/docs/software/wpilib-tools/axon/introduction.html"
      allowFullScreen={true}
    >
      Docs
    </iframe>
  );
}
