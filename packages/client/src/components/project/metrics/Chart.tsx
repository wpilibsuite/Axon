import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GetCheckpoints, GetCheckpoints_project_checkpoints } from "./__generated__/GetCheckpoints";
import { gql, useQuery } from "@apollo/client";
import React from "react";
type Checkpoint = GetCheckpoints_project_checkpoints;

type Datapoint = {
  [key: string]: number;
};

interface ClickEvent {
  payload: {
    name: number;
  };
}

const GET_CHECKPOINTS = gql`
  query GetCheckpoints($id: ID!) {
    project(id: $id) {
      checkpoints {
        id
        name
        step
        precision
      }
    }
  }
`;

export default function Chart(props: {
  id: string;
  onClick: (para: Checkpoint) => void;
  selected: Checkpoint | null;
}): React.ReactElement {
  function handleClick(step: number) {
    const checkpoint = checkpoints.find((checkpoint) => checkpoint.step === step);
    if (checkpoint) props.onClick(checkpoint);
  }

  const { data, loading, error } = useQuery<GetCheckpoints>(GET_CHECKPOINTS, {
    variables: {
      id: props.id
    },
    pollInterval: 2000
  });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined || data.project === null) return <p>NO DATA</p>;
  const checkpoints = data.project.checkpoints;

  const points: Datapoint[] = checkpoints.map((checkpoint) => {
    const point: Datapoint = { name: checkpoint.step };
    if (checkpoint.precision !== null) point["precision"] = checkpoint.precision;
    return point;
  });

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <ResponsiveContainer width="80%" height={400}>
        <LineChart
          data={points}
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
            activeDot={{ r: 8, onClick: (event: ClickEvent) => handleClick(event.payload.name) }}
            // dot={renderDot}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // function renderDot(props: {cx: number, cy: number, stroke: unknown, payload: {name:number}, value: unknown}): ReactElement {
  //   console.log(props.payload.name);
  //   if (props.payload.name !== 3) return <></>;

  //   return (
  //     <svg x={props.cx} y={props.cy} width={200} height={200} fill="red" viewBox="0 0 1024 1024">
  //     <path d="M150 0 L75 200 L225 200 Z" />
  //     </svg>
  //   )
  // }
}
