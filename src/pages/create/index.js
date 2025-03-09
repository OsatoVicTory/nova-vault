import { Route, Routes } from "react-router-dom";
import CreateHome from "./home";
import CreateGalleryPage from "./gallery";
import CreateNFT from "./asset";

const CreatePage = () => {

    return (
        <Routes>
            <Route path="/" element={<CreateHome />} />
            <Route path="/gallery" element={<CreateGalleryPage />} />
            <Route path="/asset" element={<CreateNFT />} />
        </Routes>
    );
};

export default CreatePage;