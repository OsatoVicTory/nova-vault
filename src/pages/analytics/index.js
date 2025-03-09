import { Route, Routes } from "react-router-dom";
import GalleryAnalytics from "./gallery";
import AssetAnalytics from "./asset";
import AnalyticsHome from "./analytics";

const Analytics = () => {

    return (
        <Routes>
            <Route path="/" element={<AnalyticsHome />} />
            <Route path="/gallery/:gallery_id" element={<GalleryAnalytics />} />
            <Route path="/asset/:nft_id/:gallery_id" element={<AssetAnalytics />} />
        </Routes>
    );
};

export default Analytics;