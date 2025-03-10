import { Routes, Route } from "react-router-dom";
import AppLayout from "../layout";
import Galleries from "./home";
import GalleryPage from "./galla";
import CreateNFT from "./create";
import NftAsset from "./asset";
import NftAssetReview from "./asset/assetReview";
import NftAssetToBeSold from "./asset/assetToBeSold";
import NftAssetPutForSale from "./asset/assetForSale";
import NftAssetCollected from "./asset/assetCollected";
import Analytics from "./analytics";
import Account from "./account";
import Wallet from "./wallet";

const NftApp = () => {

    return (
        <AppLayout>
            <Routes>
                <Route path='/' element={<Galleries />} />
                <Route path='/gallery/:gallery_id/*' element={<GalleryPage />} />
                <Route path='/create/*' element={<CreateNFT />} />
                <Route path='/analytics/*' element={<Analytics />} />
                <Route path='/asset/:nft_id/:gallery_id' element={<NftAsset />} />
                <Route path='/asset-review/:nft_id/:gallery_id' element={<NftAssetReview />} />
                <Route path='/asset-forsale/:nft_id/:gallery_id/:token_id/:owner' element={<NftAssetPutForSale />} />
                <Route path='/asset-sell/:nft_id/:gallery_id/:token_id/:owner' element={<NftAssetToBeSold />} />
                <Route path='/asset-collected/:nft_id/:gallery_id/:token_id/:owner' element={<NftAssetCollected />} />
                <Route path='/wallet' element={<Wallet />} />
                <Route path='/account/*' element={<Account />} />
            </Routes>
        </AppLayout>
    )
};

export default NftApp;