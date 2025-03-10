import './asset.css';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
// import { IoIosCopy } from 'react-icons/io';
import { MdArrowBack, MdKeyboardArrowDown, MdOutlineDateRange, MdOutlineDescription } from 'react-icons/md';
import { BsTag } from 'react-icons/bs';
import { PiTagSimpleBold } from 'react-icons/pi';
import { LoadingSpinner, Skeleton } from '../../components/loading';
import { getFullDateWithTime, parseGalleryData, parseNftMetaData, shortenAddy } from '../../utils';
import { 
    createERC1155ContractInstance,
    createGalleryContractInstance, createNftLibraryContractInstance, 
    createNftMarketContractInstance, createNftSubmitContractInstance, divideBigDecimals, parseBigInt 
} from '../../services/creators';
import { AppContext } from '../../context';
import ErrorPage from '../../components/error';
import NftSaleForm from './saleForm';
import SuccessModal from '../../components/modals/success';
import { AssetFile } from './assetFile';


const NftAssetToBeSold = () => {

    const { contract, wallet } = useContext(AppContext);
    const [error, setError] = useState(false);
    const [gallery, setGallery] = useState({});
    const [nftLoading, setNftLoading] = useState(true);
    const [forSale, setForSale] = useState(false);
    const [dropdowns, setDropdowns] = useState([true, false, true]);
    const [nft, setNft] = useState({});
    const { nft_id, gallery_id, owner, token_id } = useParams();
    const navigate = useNavigate();
    const { state, key } = useLocation();
    const errors = [0, "Wrong Gallery and/or Nft id in the URL.", "Invalid owner address in URL", "This Nft is not owned by this user", "This Nft is not available for sale"];

    const g_id = useMemo(() => {
        if(gallery_id) return parseBigInt(String(gallery_id));
        else return "";
    }, [gallery_id]);

    const n_id = useMemo(() => {
        if(nft_id) return parseBigInt(String(nft_id));
        else return "";
    }, [nft_id]);

    const url = window.location.href;

    const fetchPriceAndQty = async () => {
        const contractInstance = await createERC1155ContractInstance(contract.signer);
        const res_s = await contractInstance.balanceOf(owner, token_id);
        if(!res_s || res_s < 1) throw new Error(errors[3]);
        const nftMarketContractInstance = await createNftMarketContractInstance(contract.signer);
        const d_ = await nftMarketContractInstance.getCostBatch([owner], [parseBigInt(token_id)]);
        if(!d_ || !d_[0]) throw new Error(errors[3]);
        // below check if this nft has been put up for sale by looking at the quantity put for sale
        // only in forSale page should we check if it is for sale i.e >= 1
        // if(d_[0][2] < 1) throw new Error(errors[4]);
        const [price, forSale, qty] = d_[0];
        return { price: String(divideBigDecimals(price, wallet.decimals)), forSale, qty: String(qty), owned: String(res_s) };
    };

    const fetchNftData_ = async (nftLibraryContractInstance, nftSubmitContractInstance) => {
        const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, false);
        const nft_meta_data_id = String(nft_metadata_id[2]);
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id[2]); // nft_metadata_id[2]);
        const res = { 
            ...parseNftMetaData(nft_data), gallery_id: String(g_id), 
            nft_library_id: String(n_id), nft_id: String(nft_meta_data_id) 
        };
        return res;
    };

    const fetchNftData = async () => {
        try {
            setNftLoading(true);
            setError(false);
            if(state?.nft?.metadata) {
                if(state?.gallery?.name) setGallery(state.gallery);
                else {
                    const contractInstance = await createGalleryContractInstance(contract.signer);
                    const data = await contractInstance.getGallery(g_id);
                    setGallery(parseGalleryData(data));
                }
                const p = await fetchPriceAndQty();
                setNft({ ...state.nft, ...p });
                setNftLoading(false);
                return;
            }
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const data = await contractInstance.getGallery(g_id);
            setGallery(parseGalleryData(data));
            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const res = await fetchNftData_(nftLibraryContractInstance, nftSubmitContractInstance);
            const p = await fetchPriceAndQty();
            setNft({ ...res, gallery_name: data[1], ...p });
            setNftLoading(false);
        } catch (err) {
            console.log(err);
            if(err.message.includes("bad address")) setError(errors[2]);
            else if(err.message.includes("InvalidParameter(uint8)")) setError(errors[1]); 
            else if(errors.find(er => er === err.message)) setError(err.message);
            else setError(true);
            setNftLoading(false);
        }
    };

    useEffect(() => {
        fetchNftData();
    }, []);

    const dropdownClick = useCallback((index) => {
        const newArr = [...dropdowns];
        newArr[index] = !newArr[index];
        setDropdowns(newArr);
    }, [dropdowns.join("")]);

    const buttonLbClick = useCallback(() => {
        // to know if there is no history
        // if(useLocation().key === "default") is true
        // gallery data would have exist already
        navigate(`/app/account/${nft.creator}`);
    }, []);

    const buttonStClick = useCallback(() => {
        setForSale(true);
    }, []);

    const getFullDateWithTime_ = useCallback((galla) => {
        if(nftLoading || error) return "";

        if(galla) return getFullDateWithTime(gallery.votingEnd, 1000);
        else return getFullDateWithTime(nft.metadata.createdAt || (new Date("19 Feb 2025").getTime()));

    }, [nftLoading, error, gallery.votingEnd, nft.metadata]);

    const shortenAddy_ = useMemo(() => {
        if(!nft.creator) return "";
        return shortenAddy(nft.creator);
    }, [nft.creator]);

    const navBackError = useCallback(() => {
        // to know if there is no history
        if(key === "default") navigate(`/app`);
        else navigate(-1);
    }, [key]);

    return (
        <div className='NftAsset w-full'>
        {
            error ?
            <div className='nft-wrapper-error'>
                <ErrorPage fireFn={error === true ? fetchNftData : navBackError} 
                text={error === true ? null : error} btnTxt={"Go back"} />
            </div>
            :
            <div className='nft-wrapper'>
                <div className='nft-container w-full'>
                    <div className='nft-content-div w-full'>
                        {nftLoading && <div className='nft-content left-c'>
                            <div className='asset-name'>
                                <div className='asset-loading'>
                                    <Skeleton />
                                </div>
                                <div className="asn-loading"><Skeleton /></div>
                                <div className='asnp-loading'><Skeleton /></div>
                            </div>
                            <div className='asset loading'>
                                <Skeleton />
                            </div>
                        </div>}

                        {!nftLoading && <div className='nft-content left-c'>
                            <div className='asset-name'>
                                <div>
                                    <Link to={{
                                        pathname: `/app/gallery/${gallery_id}`,
                                        state: { galleryData: gallery }
                                    }}>{nft.gallery_name}</Link>
                                </div>
                                <h2 className="txt-white">{nft.metadata.name}</h2>
                                <p>
                                    <span className="txt-white">Created by</span>
                                    <Link to={`/app/account/${nft.creator}`}>{shortenAddy_}</Link>
                                </p>
                            </div>
                            <div className='asset big-vh'>
                                {
                                    (nft.metadata.src && nft.metadata.file_type !== "image") 
                                    ?
                                    <AssetFile data={nft.metadata} />
                                    :
                                    <img src={nft.metadata.img} width={'100%'} height={'100%'} alt={'asset'} />
                                }
                                {/* <div className='asset-copy'>
                                    <button className='asset-copy-btn pointer'>
                                        <IoIosCopy className='asset-copy-btn-icon' />
                                    </button>
                                </div> */}
                            </div>
                        </div>}
                        
                        {nftLoading && <div className='nft-content right-c'>
                            <div className='asset-names'>
                                <div className='asset-name'>
                                    <div className='asset-loading'>
                                        <Skeleton />
                                    </div>
                                    <div className="asn-loading"><Skeleton /></div>
                                    <div className='asnp-loading'><Skeleton /></div>
                                </div>
                                <div className='nft-content-box'>
                                    <div className='sales-time'>
                                        <div className='sales-time-loading'><Skeleton /></div>
                                    </div>
                                    <div className='asset-price-div'>
                                        <span className="loading"><Skeleton /></span>
                                        <div className='asset-price loading'><Skeleton /></div>
                                        <div className='apd-btns w-full'>
                                            <div className='apd-btns-loading'><Skeleton /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='nft-content-box price-chart-div'>
                                <div className="price-chart-top">
                                    <div className='sales-time-loading'><Skeleton /></div>
                                </div>
                                <div className='price-chart'>
                                    <div className='nft-content-box-loading'>
                                        <LoadingSpinner width={"42px"} height={"42px"} />
                                    </div>
                                </div>
                            </div>
                        </div>}

                        {!nftLoading && <div className='nft-content right-c'>
                            <div className='asset-names'>
                                <div className='asset-name'>
                                    <div>
                                        <Link to={{
                                            pathname: `/app/gallery/${gallery_id}`,
                                            state: { galleryData: gallery }
                                        }}>{nft.gallery_name}</Link>
                                    </div>
                                    <h2 className="txt-white">{nft.metadata.name}</h2>
                                    <p>
                                        <span className="txt-white">Created by</span>
                                        <Link to={`/app/account/${nft.creator}`}>{shortenAddy_}</Link>
                                    </p>
                                </div>
                                <div className='nft-content-box'>
                                    <div className='sales-time'>
                                        <BsTag className='st-icon txt-white' />
                                        <span className="txt-white">
                                            {`${nft.qty} out of ${nft.owned} quantity currently up for sale`}
                                        </span>
                                    </div>
                                    <div className='asset-price-div'>
                                        <span className="txt-white">Current price</span>
                                        <div className='asset-price txt-white'>
                                            <h2>{`${nft.price} NOVA`}</h2>
                                            {/* <span>~ {getPriceInEth(nft.price, wallet.ethPrice)} ETH</span> */}
                                        </div>
                                        <div className='apd-btns w-full'>
                                            <button className='apd-btn buy-btn pointer' onClick={buttonStClick}>
                                                <BsTag className='apdb-icon' />
                                                <span>{`${nft.qty > 0 ? "Change sale data" : "Put up for sale"}`}</span>
                                            </button>
                                            <button className='apd-btn ldb-btn pointer' onClick={buttonLbClick}>
                                                <MdArrowBack className='apdb-icon txt-white' />
                                                <span className="txt-white">Go back</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {nftLoading && <div className='nft-content-box price-chart-div'>
                                {/* chart */}

                                <div className="nft-content-box">
                                    <div className='nft-content-box-loading set-height'>
                                        <LoadingSpinner width={"42px"} height={"42px"} />
                                    </div>
                                </div>
                            </div>}

                            {!nftLoading && <div className="nft-content-box">
                                <div className='nftc-lc-div'>
                                    <div className='nftcld-top'>
                                        <div className='nftcldt'>
                                            <MdOutlineDateRange className='nftcldt-icon txt-white' />
                                            <span className='txt-white'>Date Created</span>
                                        </div>
                                        <button className='nftcld-dropdown pointer' onClick={() => dropdownClick(0)}>
                                            <MdKeyboardArrowDown className={`nftcldd-icon ${dropdowns[0]} txt-white`} />
                                        </button>
                                    </div>
                                    <div className={`nftcld-body ${dropdowns[0]}`}>
                                        <span className='txt-white nf-date'>{`${getFullDateWithTime_(0)}`}</span>
                                    </div>
                                </div>
                                <div className='nftc-lc-div'>
                                    <div className='nftcld-top'>
                                        <div className='nftcldt'>
                                            <MdOutlineDescription className='nftcldt-icon txt-white' />
                                            <span className='txt-white'>Description</span>
                                        </div>
                                        <button className='nftcld-dropdown pointer' onClick={() => dropdownClick(1)}>
                                            <MdKeyboardArrowDown className={`nftcldd-icon ${dropdowns[1]} txt-white`} />
                                        </button>
                                    </div>
                                    <div className={`nftcld-body ${dropdowns[1]}`}>
                                        <span className='txt-white nf-desc'>
                                            <span className='txt-white nf-desc'>{nft.metadata.description}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className='nftc-lc-div'>
                                    <div className={`nftcld-top ${!dropdowns[2] ? 'last-child' : ''}`}>
                                        <div className='nftcldt'>
                                            <PiTagSimpleBold className={`nftcldt-icon txt-white`} />
                                            <span className='txt-white'>Attributes</span>
                                        </div>
                                        <button className='nftcld-dropdown pointer' onClick={() => dropdownClick(2)}>
                                            <MdKeyboardArrowDown className={`nftcldd-icon ${dropdowns[2]} txt-white`} />
                                        </button>
                                    </div>
                                    <div className={`nftcld-body ${dropdowns[2]} last-child`}>
                                        <div className='nftcldb-flex w-full'>
                                            {nft.metadata.attributes.map((att, idx) => (
                                                <div key={`att-${idx}`}>
                                                    <span className='txt-white nf-type'>{att[0]}</span>
                                                    <span className='txt-white nf-value'>{att[1]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>}

                        </div>}

                        {/* <div className='nft-content left-c margin-up'>
                            the part below / chart / abive was here before
                        </div> */}
                    </div>
                </div>
            </div> 
        }

        {forSale && <NftSaleForm closeModal={() => setForSale(false)} nft={nft}
        successFn={() => setForSale("success")} n_id={n_id} token_id={token_id} />}

        {forSale === "success" && <SuccessModal closeModal={() => setForSale(false)} 
        text={"Offer has been created successfully. Your Nft is now up for sale."} />}

        </div>
    )
};

export default NftAssetToBeSold;