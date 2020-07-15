import React from "react";
import { Card, CardHeader } from "@material-ui/core";

function DatasetCard(props: { dataset: Dataset }) {
  return (
    <Card>
      <CardHeader title={dataset} />
    </Card>
  );
}
