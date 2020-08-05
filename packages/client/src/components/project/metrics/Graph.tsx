import React, { useEffect, useRef, useState, ReactElement } from "react";
import Chartjs from "chart.js";
import { GetProjectCheckpoints_project_checkpoints } from "./__generated__/GetProjectCheckpoints";

const colorMap: { [key: string]: string } = {
  precision: "rgba(0,255,0,1)",
  recall: "rgba(255,0,255,1)",
  loss: "rgba(0,255,255,1)"
};
const options = {
  fill: 0,
  tooltips: { enabled: false },
  responsive: "true",
  animation: {
    duration: 0
  },
  maintainAspectRatio: false,
  legend: {
    labels: {
      fontColor: "white",
      fontSize: 10
    }
  },
  scales: {
    yAxes: [
      {
        ticks: {
          fontColor: "white",
          fontSize: 10,
          stepSize: 10,
          beginAtZero: true
        },
        stacked: true,
        gridLines: {
          display: true,
          color: "rgba(255,1,255,.5)"
        }
      }
    ],
    xAxes: [
      {
        ticks: {
          fontColor: "white",
          fontSize: 10,
          stepSize: 1,
          beginAtZero: true
        },
        gridLines: {
          display: false
        }
      }
    ]
  }
};

interface chartDataset {
  label: string;
  fill: boolean;
  data: number[];
  backgroundColor: string;
  borderColor: string;
}

export default function Graph(props: { data: GetProjectCheckpoints_project_checkpoints[] | undefined }): ReactElement {
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState<{ labels: number[]; datasets: chartDataset[] }>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (chartRef && chartRef.current) {
      const newChartInstance = new Chartjs((chartRef.current as unknown) as CanvasRenderingContext2D, {
        type: "line",
        data: chartData,
        options: (options as unknown) as Chartjs.ChartOptions
      });
      setChartInstance(newChartInstance);
    }
  }, [chartRef]);

  if (props.data && props.data.length !== 0) {
    chartData.labels = props.data.map((checkpoint) => checkpoint.step);
    chartData.datasets = Object.keys(props.data[0].metrics).map((key) => {
      return {
        label: key,
        fill: false,
        //need to set up types for the keys of GetProjectCheckpoints_project_checkpoints_metrics so I can use "key" as an index: checkpoint.metrics[key]. Dont know how
        data: props.data ? props.data.map((checkpoint) => checkpoint.metrics.precision) : [],
        backgroundColor: colorMap[key],
        borderColor: colorMap[key]
      };
    });
  }

  return (
    <div>
      <canvas id="myChart" ref={chartRef} />
    </div>
  );
}
