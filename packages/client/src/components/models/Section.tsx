import * as React from "react";
import { Typography } from "@material-ui/core";

export interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <>
      <Typography variant="body1" gutterBottom>
        {title}
      </Typography>
      {children}
    </>
  );
}
