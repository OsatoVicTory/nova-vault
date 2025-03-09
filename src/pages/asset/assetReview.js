import './asset.css';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { IoIosCopy } from 'react-icons/io';
import { MdArrowBack, MdKeyboardArrowDown, MdOutlineDateRange, MdOutlineDescription, MdOutlineRateReview } from 'react-icons/md';
import { BsClock } from 'react-icons/bs';
import { PiTagSimpleBold } from 'react-icons/pi';
import { LoadingSpinner, Skeleton } from '../../components/loading';
import { getFullDateWithTime, parseGalleryData, parseNftMetaData, setMessageFn, shortenAddy } from '../../utils';
import { createGalleryContractInstance, createNftLibraryContractInstance, createNftSubmitContractInstance, getPriceInEth, parseBigInt } from '../../services/creators';
import { AppContext } from '../../context';
import ErrorPage from '../../components/error';
import { AiOutlineDislike, AiOutlineLike } from 'react-icons/ai';
import { FaCheck } from 'react-icons/fa6';
import { AssetFile } from './assetFile';
import { COUNTDOWN_PERMIT, COUNTDOWN_REVEAL_TIME } from '../../config';


const NftAssetReview = () => {

    const { contract, setMessage, wallet } = useContext(AppContext);
    const [error, setError] = useState(false);
    const [gallery, setGallery] = useState({});
    const [nftLoading, setNftLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [acceptLoading, setAcceptLoading] = useState(false);
    const [dropdowns, setDropdowns] = useState([true, false, true]);
    const [nft, setNft] = useState({});
    const [liveUpdate, setLiveUpdate] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef();
    const { nft_id, gallery_id } = useParams();
    const navigate = useNavigate();
    const { state, key } = useLocation();
    const errors = "Wrong Gallery and/or Nft id in the URL.";

    const g_id = useMemo(() => {
        if(gallery_id) return parseBigInt(String(gallery_id));
        else return "";
    }, [gallery_id]);

    const n_id = useMemo(() => {
        if(nft_id) return parseBigInt(String(nft_id));
        else return "";
    }, [nft_id]);

    const url = window.location.href;

    const fetchNftData_ = async (nftLibraryContractInstance, nftSubmitContractInstance) => {
        // use true here cus, this page only visible to admins
        const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, true);
        const nft_meta_data_id = String(nft_metadata_id[2]);
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id[2]); // ft_metadata_id[2]);
        const review = nft_metadata_id[1];
        const res = { ...parseNftMetaData(nft_data), nft_library_id: String(n_id), nft_id: nft_meta_data_id, review };
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
                setNft(state.nft);
                setNftLoading(false);
                return;
            }
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const data = await contractInstance.getGallery(g_id);
            setGallery(parseGalleryData(data));
            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const res = await fetchNftData_(nftLibraryContractInstance, nftSubmitContractInstance);
            setNft({ ...res, gallery_name: data[1] });
            setNftLoading(false);
        } catch (err) {
            console.log(err);
            if(err.message.includes("InvalidParameter(uint8)")) setError(errors); 
            else setError(true);
            setNftLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    useEffect(() => {
        fetchNftData();
        
        // clean up timeInterval
        return () => timerRef.current && clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if(gallery.votingEnd) {
            // console.log(
            //     String(new Date((gallery.votingStart-0) * 1000)), 
            //     String(new Date((gallery.votingEnd-0) * 1000))
            // );
            // timer timing till votingStart and votingEnd to notify user accordingly
            let d_timer = (gallery.votingStart - (new Date().getTime() / 1000));
            let end_timer = (gallery.votingEnd - (new Date().getTime() / 1000));
            let f_ = "";
            let update_ = false, show_time = false;
            // (d_timer <= 0 || d_timer > COUNTDOWN_PERMIT) means votingStart has passed or votingStart is more than 24 hrs from now
            // same for end_timer, only its for votingEnd
            if((d_timer <= 0 || d_timer > COUNTDOWN_PERMIT) && (end_timer <= 0 || end_timer > COUNTDOWN_PERMIT)) { 
                return;
            } 

            timerRef.current = setInterval(() => {

                if(d_timer > 0) d_timer -= 1;
                if(end_timer > 0) end_timer -= 1;

                // let timer countdown show only if <= 20 mins (COUNTDOWN_REVEAL_TIME)
                // useMemo -> canReview below, which would have picked up the time on mount
                if((d_timer > 0 && d_timer <= COUNTDOWN_REVEAL_TIME) || (end_timer > 0 && end_timer <= COUNTDOWN_REVEAL_TIME)) {
                    const q_ = (d_timer > 0 && d_timer <= COUNTDOWN_REVEAL_TIME) ? "start" : "end";
                    if(q_ !== f_) {
                        setShowTimer(q_);
                        f_ = q_;
                        show_time = true;
                    }
                    setTimer(d_timer > 0 ? d_timer : end_timer);
                } else { // do not show timer
                    if(show_time) {
                        setShowTimer(false);
                        show_time = false;
                    }
                }

                if(d_timer <= 0 && end_timer > 0 && update_ !== "live") { // mainly for when we are live
                    setLiveUpdate("live");
                    update_ = "live";
                } else if(end_timer <= 0 && update_ !== "ended") {
                    setLiveUpdate("ended"); // for end_timer <= 0 so cannot review
                    update_ = "ended"; 
                } 
                
                if((d_timer <= 0 || d_timer > COUNTDOWN_PERMIT) && (end_timer <= 0 || end_timer > COUNTDOWN_PERMIT)) {
                    if(show_time) {
                        setShowTimer(false);
                        show_time = false;
                    }
                    clearTimeout(timerRef.current);
                }

            }, 1000); 
        }

        return () => timerRef.current && clearInterval(timerRef.current);

    }, [gallery.votingEnd]);

    const dropdownClick = useCallback((index) => {
        const newArr = [...dropdowns];
        newArr[index] = !newArr[index];
        setDropdowns(newArr);
    }, [dropdowns.join("")]);

    const buttonLbClick = useCallback(() => {
        // to know if there is no history
        if(key === "default") navigate(`/app/gallery/${gallery_id}`, { state: { galleryData: gallery } });
        else navigate(-1, { state: { galleryData: gallery } });
    }, []);

    const buttonStClick = useCallback(async (nft_state) => {
        try {
            setAcceptLoading(nft_state);
            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const tx = await nftLibraryContractInstance.setNftState(g_id, n_id, nft_state);
            await tx.wait();
            setAcceptLoading(false);
            setMessageFn(setMessage, { status: 'success', message: 'Review done successfully.' });
            buttonLbClick();
        } catch(err) {
            console.log(err);
            setAcceptLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch(err) {
            console.log(err);
        }
    };
    
    const timing = useMemo(() => {
        if(!timer) return { mins: 0, secs: 0 };
        const Z_ = (v) => v > 9 ? v : `0${v}`;
        return { mins: Z_(Math.floor(timer / 60)), secs: Z_(Math.floor(timer % 60)) };
    }, [timer]);

    const canReview = useMemo(() => {
        if(liveUpdate === "ended" || liveUpdate === "live") return false;
        const d = (new Date().getTime() / 1000);
        if(!gallery.votingStart || nft.review > 0) return false;
        else return d < gallery.votingStart; // since votingEnd is in seconds
    }, [gallery.votingStart, nft.review, liveUpdate]);

    const navBackError = useCallback(() => {
        // to know if there is no history
        if(key === "default") navigate(`/app`);
        else navigate(-1);
    }, [key]);

    const reviewState = useMemo(() => {
        if(!nft.review) return "Not reviewed";
        else if(nft.review === 1) return "Accepted";
        else return "Rejected";
    }, [nft.review]);

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
                                <div className='asset-copy'>
                                    <button className='asset-copy-btn pointer' onClick={handleCopy}>
                                        {
                                            copied ?
                                            <FaCheck className='asset-copy-btn-icon' />
                                            :
                                            <IoIosCopy className='asset-copy-btn-icon' />
                                        }
                                    </button>
                                </div>
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
                                        <BsClock className='st-icon txt-white' />
                                        <span className="txt-white">{`Voting ends ${getFullDateWithTime_(1)}`}</span>
                                    </div>
                                    {showTimer && <div className="asset-timer">
                                        <span className='txt-white'>{`Voting ${showTimer} countdown`}</span>
                                        <div className='a-timer'>
                                            <div>
                                                <span className='timer-value txt-white'>{timing.mins}</span>
                                                <span className='timer-name txt-white'>Minutes</span>
                                            </div>
                                            <div>
                                                <span className='timer-value txt-white'>{timing.secs}</span>
                                                <span className='timer-name txt-white'>Seconds</span>
                                            </div>
                                        </div>
                                    </div>}
                                    <div className='asset-price-div'>
                                        <span className="txt-white">Min. Staking amount</span>
                                        <div className='asset-price txt-white'>
                                            <h2>{`${gallery.minStakingAmount} NOVA`}</h2>
                                            <span>~ {getPriceInEth(gallery.minStakingAmount, wallet.ethPrice)} ETH</span>
                                        </div>
                                        {
                                            canReview ?
                                            <div className='apd-btns w-full'>
                                                <button className='apd-btn buy-btn pointer' onClick={() => buttonStClick(1)}>
                                                    <AiOutlineLike className='apdb-icon' />
                                                    <span>{acceptLoading === 1 ? "Accepting..." : "Accept entry"}</span>
                                                </button>
                                                <button className='apd-btn ldb-btn pointer' onClick={() => buttonStClick(2)}>
                                                    <AiOutlineDislike className='apdb-icon txt-white' />
                                                    <span className="txt-white">
                                                        {acceptLoading === 2 ? "Rejecting..." : "Reject entry"}
                                                    </span>
                                                </button>
                                            </div>
                                            :
                                            <div className='apd-btns w-full'>
                                                <button className='apd-btn no-styling'>
                                                    <MdOutlineRateReview className='apdb-icon' />
                                                    <span>{reviewState}</span>
                                                </button>
                                                <button className='apd-btn ldb-btn pointer' onClick={buttonLbClick}>
                                                    <MdArrowBack className='apdb-icon txt-white' />
                                                    <span className="txt-white">Go back</span>
                                                </button>
                                            </div>
                                        }
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
        </div>
    )
};

export default NftAssetReview;