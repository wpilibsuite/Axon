import React from "react";
import Chart from "chart.js";

export default class Graph extends React.Component {
  chartRef = React.createRef();

  colormap = {
    precision: "rgba(0,255,0,1)",
    recall: "rgba(255,0,255,1)",
    loss: "rgba(0,255,255,1)"
  };
  options = {
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

  chartdata = {
    labels: [],
    datasets: []
  };

  componentDidMount() {
    if (this.props.data.length !== 0) {
      this.chartdata.labels = this.props.data.map((checkpoint) => checkpoint.step);

      this.chartdata.datasets = Object.keys(this.props.data[0].metrics).map((key) => {
        return {
          label: key,
          fill: false,
          data: this.props.data.map((checkpoint) => checkpoint.metrics[key]),
          backgroundColor: this.colormap[key],
          borderColor: this.colormap[key]
        };
      });
    }

    const myChartRef = this.chartRef.current.getContext("2d");

    new Chart(myChartRef, {
      type: "line",
      data: this.chartdata,
      options: this.options
    });
  }
  render() {
    return (
      <div>
        <canvas id="myChart" ref={this.chartRef} responsive={true} />
      </div>
    );
  }
}
