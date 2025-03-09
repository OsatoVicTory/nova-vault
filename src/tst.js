import './pages/asset/asset.css';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { IoIosCopy } from 'react-icons/io';
import { MdArrowBack, MdKeyboardArrowDown, MdOutlineDateRange, MdOutlineDescription, MdOutlineRateReview } from 'react-icons/md';
import { BsClock } from 'react-icons/bs';
import { PiTagSimpleBold } from 'react-icons/pi';
import { LoadingSpinner, Skeleton } from './components/loading';
import { getFullDateWithTime, setMessageFn, shortenAddy } from './utils';
import { parseBigInt } from './services/creators';
import { AppContext } from './context';
import { AiOutlineDislike, AiOutlineLike } from 'react-icons/ai';
import { FaCheck } from 'react-icons/fa6';
import img from "./assets/nft_3.png";


const NftAssetReviewT = () => {

    const { contract, setMessage } = useContext(AppContext);
    const [error, setError] = useState(false);
    const [gallery, setGallery] = useState({});
    const [nftLoading, setNftLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [acceptLoading, setAcceptLoading] = useState(false);
    const [dropdowns, setDropdowns] = useState([true, false, true]);
    const [nft, setNft] = useState({});
    const { nft_id, gallery_id } = { nft_id: "1", gallery_id: "1" };
    const navigate = useNavigate();
    const { state, key } = useLocation();
    const [liveUpdate, setLiveUpdate] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef();
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

    const fetchNftData = async () => {
        try {
            setNftLoading(true);
            setError(false);
            const votingStart = (new Date().getTime() / 1000) - 15;
            const votingEnd = (new Date().getTime() / 1000) - 25;
            const res = {
                creator: "Based", gallery_name: "Chip Gamez",
                metadata: { 
                    name: "Cheap gamez #1", createdAt: new Date().getTime(),
                    img: img, description: "First #1", attributes: [["Background:", "Black 12%"]]
                }
            };
            setGallery({ votingStart, votingEnd, minStakingAmount: "0.0000001" });
            
            setNft({ ...res });
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
    }, []);

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
    
    const getFullDateWithTime_ = useCallback((galla) => {
        if(nftLoading || error) return "";

        if(galla) return getFullDateWithTime(gallery.votingEnd, 1000);
        else return getFullDateWithTime(nft.metadata.createdAt || (new Date("19 Feb 2025").getTime()));

    }, [nftLoading, error, gallery.votingEnd, nft.metadata]);

    useEffect(() => {
        if(gallery.votingEnd) {
            console.log(
                String(new Date((gallery.votingStart-0) * 1000)), 
                String(new Date((gallery.votingEnd-0) * 1000))
            );
            // timer timing till votingStart and votingEnd to notify user accordingly
            let d_timer = (gallery.votingStart - (new Date().getTime() / 1000));
            let end_timer = (gallery.votingEnd - (new Date().getTime() / 1000));
            let f_ = d_timer <= 1200 ? "start" : "end";
            let update_ = false;
            // (d_timer <= 0 || d_timer > 1200) means votingStart has passed or votingStart is more than 20 mins from now
            // same for end_timer, only its for votingEnd
            if((d_timer <= 0 || d_timer > 1200) && (end_timer <= 0 || end_timer > 1200)) { // if more than 20 mins then no need for countdown
                return;
            } else {
                setShowTimer(f_);
            }

            timerRef.current = setInterval(() => {

                if(d_timer > 0) d_timer -= 1;
                if(end_timer > 0) end_timer -= 1;

                // only when end_timer has not elapsed i.e votingEnd has not reached
                // should we update to live if d_timer which is votingStart countdown reaches 0
                {
                    if(d_timer <= 0 && end_timer > 0) {
                        if(update_ !== "live") {
                            setLiveUpdate("live");
                            update_ = "live";
                        }
                        if(f_ !== "end") {
                            setShowTimer("end");
                            f_ = "end";
                        }
                    } else if(end_timer <= 0 && update_ !== "ended") {
                        setLiveUpdate("ended");
                        update_ = "ended";
                    }
                }

                if((d_timer <= 0 || d_timer > 1200) && (end_timer <= 0 || end_timer > 1200)) {
                    setShowTimer(false);
                    clearTimeout(timerRef.current);
                } else {
                    setTimer(d_timer > 0 ? d_timer : end_timer);
                }

            }, 1000); 
        }

        return () => timerRef.current && clearInterval(timerRef.current);

    }, [gallery.votingEnd]);

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
        <div className='NftAsset w-full asset-review-t light-mode'>
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
                                            <span>~ 0.003 ETH</span>
                                        </div>
                                        {
                                            canReview ?
                                            <div className='apd-btns w-full'>
                                                <button className='apd-btn buy-btn pointer'>
                                                    <AiOutlineLike className='apdb-icon' />
                                                    <span>{acceptLoading === 1 ? "Accepting..." : "Accept entry"}</span>
                                                </button>
                                                <button className='apd-btn ldb-btn pointer'>
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
        </div>
    )
};

export default NftAssetReviewT;