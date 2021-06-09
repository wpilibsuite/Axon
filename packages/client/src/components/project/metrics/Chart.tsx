import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { GetCheckpoints, GetCheckpoints_project_checkpoints } from "./__generated__/GetCheckpoints";
import { gql, useQuery } from "@apollo/client";
import React from "react";
import { grey } from "@material-ui/core/colors";

type Checkpoint = GetCheckpoints_project_checkpoints;

type Datapoint = {
  [key: string]: number;
};

interface ClickEvent {
  payload: {
    step: number;
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
    const point: Datapoint = { step: checkpoint.step };
    if (checkpoint.precision !== null) point["precision"] = checkpoint.precision;
    return point;
  });

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <ResponsiveContainer width="100%" height={400}>
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
          <XAxis dataKey="step" label={{ value: "Epoch", position: "bottom", fontSize: 15, fill: "white" }} />
          <YAxis label={{ value: "Precision", position: "insideLeft", angle: -90, fontSize: 15, fill: "white" }} />
          <Tooltip />
          <Legend align="left" />

          <ReferenceLine x={props.selected?.step} stroke="#3f50b5" strokeWidth={10} />

          <Line
            type="monotone"
            dataKey="precision"
            stroke="#3f50b5"
            strokeWidth="1"
            dot={{ r: 3 }}
            activeDot={{ r: 15, onClick: (event: ClickEvent) => handleClick(event.payload.step) }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
