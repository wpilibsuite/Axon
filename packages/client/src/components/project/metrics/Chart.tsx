import React, { ReactElement } from "react";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GetProjectData_project_checkpoints } from "../__generated__/GetProjectData";

type Datapoint = {
  [key: string]: number;
};

export default function Chart(props: {
  checkpoints: GetProjectData_project_checkpoints[];
  onClick: (para: number) => void;
}): ReactElement {
  const data: Datapoint[] = props.checkpoints.map((checkpoint) => {
    const point: Datapoint = { name: checkpoint.step };

    if (checkpoint.precision !== null) point["precision"] = checkpoint.precision;

    return point;
  });

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
