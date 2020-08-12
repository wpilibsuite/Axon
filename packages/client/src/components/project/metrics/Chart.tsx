import React, { ReactElement } from "react";
import { GetProjectCheckpoints_project_checkpoints } from "./__generated__/GetProjectCheckpoints";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Datapoint = {
  // I know this doesnt help but this could have the metrics soon
  [attribute: string]: string | number;
};

export default function Chart(props: {
  checkpoints: GetProjectCheckpoints_project_checkpoints[] | undefined;
  onClick: (para: number) => void;
}): ReactElement {
  const data: Datapoint[] = props.checkpoints
    ? props.checkpoints.map((checkpoint) => {
        const point = { name: checkpoint.step };
        Object.assign(point, checkpoint.metrics);
        return point;
      })
    : [];

  function handleClick(step: number) {
    props.onClick(step);
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 5
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />

        <Line
          type="monotone"
          dataKey="precision"
          stroke="#8884d8"
          activeDot={{ r: 8, onClick: (event: any) => handleClick(event.payload.name) }}
          //must find an event type that lets me access its payload
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
