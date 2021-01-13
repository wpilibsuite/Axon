import React, { ReactElement } from "react";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from "recharts";
import { GetProjectData_project_checkpoints } from "../__generated__/GetProjectData";

type Datapoint = {
  [key: string]: number;
};

interface ClickEvent {
  payload: {
    name: number
  }
}

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
          top: 0,
          right: 0,
          left: 20,
          bottom: 0
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" label={{value:"Epoch number", position:"insideBottom"}} />
        <YAxis label={{value:"Percent", position:"insideLeft", offset:-10, angle:-90}}/>
        <Tooltip />
        <Legend />

        <Line
          type="monotone"
          dataKey="precision"
          stroke="primary"

          dot={{r:5}}
          activeDot={{ r: 10, onClick: (event: ClickEvent) => handleClick(event.payload.name) }}
          //must find an event type that lets me access its payload
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
