// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend } from "chart.js/auto";
import { Chart as ChartJS, registerables } from "chart.js";
import { Bar } from "react-chartjs-2";
// import { TOKEN_SYMBOL } from "../../config";
import { useMemo, useRef } from "react";

// ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);
ChartJS.register(...registerables);

const BarChartComponent = ({ datasets, labels, legend, smallSize, changed }) => {

    const delayed = useRef("");

    const Data = useMemo(() => {
        return {
            labels,
            datasets
        };
    }, [changed]);

    const optionsData = useMemo(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: legend||false
                },
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
                    ticks: {
                        font: {
                            size: smallSize ? 12 : 13,
                        }
                    }
                } 
            }
        }
    }, [changed]);

    return (
        <Bar
            data={{...Data}} id="barChart"
            width={"100%"} height={"100%"}
            options={{...optionsData}}
        />
    );
};

export default BarChartComponent;