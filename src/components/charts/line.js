// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Chart as ChartJS, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
// import { TOKEN_SYMBOL } from "../../config";
import { useMemo, useRef } from "react";

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
ChartJS.register(...registerables);

const LinePlotComponent = ({ datasets, labels, legend, radius, formatX, smallSize, xLabels, changed }) => {

    const delayed = useRef("");

    const Data = useMemo(() => {
        return {
            labels,
            datasets
        };
    }, [changed]);

    const optionsData = useMemo(() => {
        return {
            radius: radius || 3,
            hitRadius: 20,
            hoverRadius: radius ? (radius * 1.8) : 6,
            responsive: true,
            maintainAspectRatio: false,
            showXLabels: xLabels || true,
            plugins: {
                legend: {
                    display: legend||false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label||"Value"}: ${context.raw}`;
                        }
                    }
                }
                // title: {
                //     display: true,
                //     text: "Activity for last 7 days"
                // }
            },
            animation: {
                onComplete: () => {
                    delayed.current = true;
                },
                delay: (context) => {
                    let delay = 0;
                    if(context.type === "data" && context.mode === "default" && !delayed.current) {
                        delay = context.dataIndex * 300 + context.datasetIndex * 100;
                    }
                    return delay;
                },
            },
            scales: {
                y: {
                    ticks: {
                        callback: function (value) {
                            return `${value}`
                        },
                        font: {
                            size: 12,
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function (val) {
                            const value = this.getLabelForValue(val);
                            return `${formatX ? formatX(value) : value}`
                        },
                        font: {
                            size: smallSize ? 12 : 13,
                        }
                    }
                } 
            }
        }
    }, [changed]);

    return (
        <Line
            data={{...Data}} id="myChart"
            width={"100%"} height={"100%"}
            options={{...optionsData}}
        />
    )
};

export default LinePlotComponent;