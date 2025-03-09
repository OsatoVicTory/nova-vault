// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart as ChartJS, registerables } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";

// ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(...registerables);

const DoughtnutComponent = ({ datasets, labels, legend, changed }) => {

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
                    position: window.innerWidth > 500 ? legend : undefined,
                },
            }
        }
    }, [changed]);

    return (
        <Doughnut
            data={{...Data}} id="doughnutChart"
            width={"100%"} height={"100%"}
            options={{...optionsData}}
        />
    );
};

export default DoughtnutComponent;