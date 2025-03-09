import { LoadingSpinner } from "../loading";

const ChartLoading = () => {
    return (
        // styling can be found in App.css
        <div className="Chart-loading w-full h-full">
            <LoadingSpinner width={"42px"} height={"42px"} />
        </div>
    );
};

export default ChartLoading;