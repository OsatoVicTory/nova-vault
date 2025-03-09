import { Suspense, lazy } from "react";
import ChartLoading from "./loading";

const LinePlotComponent = lazy(() => import("./line"));
const DoughtnutComponent = lazy(() => import("./doughnut"));
const BarChartComponent = lazy(() => import("./bar"));

const ChartComponent = ({ datasets, labels, legend, radius, chartType, xLabels, changed }) => {
    return (
        <div className="Chart-Div w-full h-full">
            {
                chartType === "doughnut" ?
                <Suspense fallback={<ChartLoading />}>
                    <DoughtnutComponent datasets={datasets} labels={labels} legend={legend} changed={changed} />
                </Suspense> 
                :
                (
                    chartType === "bar" ?
                    <Suspense fallback={<ChartLoading />}>
                        <BarChartComponent datasets={datasets} labels={labels} legend={legend} changed={changed} />
                    </Suspense> 
                    :
                    <Suspense fallback={<ChartLoading />}>
                        <LinePlotComponent datasets={datasets} labels={labels} legend={legend} 
                        radius={radius} xLabels={xLabels} changed={changed} />
                    </Suspense>
                )
            }
        </div>
    )
};

export default ChartComponent;