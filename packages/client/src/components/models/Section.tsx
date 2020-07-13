import * as React from "react";
import { Typography } from "@material-ui/core";
import { ReactElement } from "react";

export interface Props {
  title: string;
  children: React.ReactNode;
}

export default function Section({ title, children }: Props): ReactElement {
  return (
    <>
      <Typography variant="body1" gutterBottom>
        {title}
      </Typography>
      {children}
    </>
  );
}
