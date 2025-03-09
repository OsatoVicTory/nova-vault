import './asset.css';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IoIosCopy } from 'react-icons/io';
import { MdArrowBack, MdKeyboardArrowDown, MdOutlineDateRange, MdOutlineDescription, MdOutlineLeaderboard } from 'react-icons/md';
import { BsClock, BsTag } from 'react-icons/bs';
import ChartComponent from '../../components/charts';
import { SlGraph } from 'react-icons/sl';
import { NFTGridImage } from '../../components/renderImage/nftImage';
import { PiGridNineBold, PiTagSimpleBold } from 'react-icons/pi';
import { FaList } from 'react-icons/fa';
import LeaderBoard from './leaderboard';
import { LoadingSpinner, Skeleton } from '../../components/loading';
import useResizeThrottle from '../../hooks/useResize';
// import { fakeNftData } from '../../fakeDatas';
import { getFullDateWithTime, parseAmount, parseGalleryData, parseNftMetaData, setMessageFn, shortenAddy } from '../../utils';
import { 
    createGalleryContractInstance, createMinterContractInstance, 
    createNftLibraryContractInstance, createNftSubmitContractInstance, 
    createStakeContractInstance, divideBigDecimals, parseBigInt 
} from '../../services/creators';
import { AppContext } from '../../context';
import ErrorPage from '../../components/error';
import NoData from '../../components/noData';
import StakeForm from './stake';
import { FaCheck } from 'react-icons/fa6';
import SuccessModal from '../../components/modals/success';
import { AssetFile } from './assetFile';
import { COUNTDOWN_PERMIT, COUNTDOWN_REVEAL_TIME } from '../../config';
// import { formatAssetAnalyticsAddress } from '../../services/galleryAnalytics';


const NftAsset = () => {

    const { contract, setMessage, wallet } = useContext(AppContext);
    const [route, setRoute] = useState("");
    const [error, setError] = useState(false);
    const [gallery, setGallery] = useState({});
    const [stakeForm, setStakeForm] = useState(false);
    const [nftLoading, setNftLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [nft, setNft] = useState({});
    const [stakersLoading, setStakersLoading] = useState(true);
    const [stakers, setStakers] = useState({ data: [], loaded: false }) // first 20 stakers
    const [moreAssetsLoading, setMoreAssetsLoading] = useState(true);
    const [moreAssets, setMoreAssets] = useState({ data: [], loaded: false });
    const [isTopThree, setIsTopThree] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    // claimable below made true because, we only want to determine this after user has tried to claim or clicked claim button
    const [claimable, setClaimable] = useState(true); 
    const [modal, setModal] = useState("");
    const [succesModalText, setSuccessModalText] = useState("");
    const [canVote, setCanVote] = useState(false);
    const [fetchNewStakers, setFetchNewStakers] = useState("");

    const [chart, setChart] = useState({ dataset: [], labels: [] });
    // const [loaded, setLoaded] = useState([]);
    const [dropdowns, setDropdowns] = useState([true, false, true]);
    const [width, setWidth] = useState(window.innerWidth);
    const { nft_id, gallery_id } = useParams();
    const { state, key } = useLocation();
    const { status } = useSearchParams();
    const navigate = useNavigate();
    const [claimTime, setClaimTime] = useState(false);
    const [liveUpdate, setLiveUpdate] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef();
    const errors = "Wrong Gallery and/or Nft id in the URL.";

    const g_id = useMemo(() => {
        return parseBigInt(String(gallery_id));
    }, [gallery_id]);
    const n_id = useMemo(() => {
        return parseBigInt(String(nft_id));
    }, [nft_id]);

    const skeletons = Array(5).fill(0);

    const url = window.location.href;

    const fetchNftData_ = async (index, nftLibraryContractInstance, nftSubmitContractInstance) => {
        // const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, false);
        const nft_index = parseBigInt(index);

        const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, nft_index, false);
        const nft_meta_data_id = String(nft_metadata_id[2]);
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id[2]); // ft_metadata_id[2]);
        const res = { ...parseNftMetaData(nft_data), nft_library_id: String(nft_index), nft_id: String(nft_meta_data_id) };
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
            const res = await fetchNftData_(nft_id, nftLibraryContractInstance, nftSubmitContractInstance);
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

    const formatX = useCallback((addy) => {
        return addy.slice(0, 3) + "..." + addy.slice(-3);
    }, []);

    const getStakersChartData = (st) => {

        const computeBg = () => {
            const ctx = document.createElement("canvas").getContext("2d");
            const grad = ctx.createLinearGradient(0, 0, 0, 400);
            grad.addColorStop(0, "rgba(58, 123, 213, 0.8)");
            grad.addColorStop(1, "rgba(0, 210, 255, 0.21)");
            return grad;
        };

        const data = [], labels = [];
        for(const staker of st.slice(-20)) {
            data.push(String(divideBigDecimals(staker.stake_amount, wallet.decimals)));
            labels.push(formatX(staker.staker));
        }
        if(labels.length > 0) {
            labels.unshift("Start");
            data.unshift(0);
        }

        setChart({
            labels,
            dataset: [
                {
                    data,
                    label: "Staker",
                    borderColor: "rgba(58, 123, 213, 0.5)", //"rgba(60, 207, 46, 0.5)",
                    fill: true,
                    backgroundColor: computeBg(),
                    borderWidth: 1.5,
                    pointBackgroundColor: "#fff" // for tooltip
                }
            ], 
            loaded: true,
            changed: new Date().getTime() / 1000
        });
    };

    const getCast = async (stakeContractInstance, idx) => {
        const res = await stakeContractInstance.getCast(g_id, n_id, idx);
        return { staker: res[2], stake_amount: res[0], date: res[1], vote_id: String(idx) };
    };

    const fetchStakers = async (routeChanged = false, noLoading = false) => {
        try {
            // noLoading -> true, means we are trying to update based on we just staked and want to update the stakers data
            if(!noLoading) setStakersLoading(true);
            if(!routeChanged) setStakers({ ...stakers, error: false });
            else setStakers({ data: [], error: false, loaded: false }); // routeChanged means new nft_id, so setloaded to false
            // so it does not appear like we have loaded current nft_id data as previous one is loaded already
            
            const stakeContractInstance = await createStakeContractInstance(contract.signer);
            
            let total_votes = await stakeContractInstance.getTotalVotes(g_id, n_id);
            // console.log("total_votes", total_votes, n_id);

            const arr = [];
            for(let i = 1; i <= total_votes; i++) arr.push(parseBigInt(i));
            const stakes = await Promise.all(arr.map((idx) => getCast(stakeContractInstance, idx).then(res => res)));

            // console.log("stakes", stakes);

            const sorted_stakes = [...stakes].sort((a, b) => {
                return b.stake_amount > a.stake_amount ? 1 : b.stake_amount < a.stake_amount ? -1 : 0
            });

            const hasVoted_ = await stakeContractInstance.hasVoted(g_id, contract.address);
            let amongVoters = false;
            const stakes_mapped = [];
            for(const st_val of sorted_stakes) {
                const st_amt = String(parseAmount(divideBigDecimals(st_val.stake_amount, wallet.decimals))) ;
                if(st_val.staker === contract.address) amongVoters = st_amt;
                stakes_mapped.push({ 
                    ...st_val, stake_amount: st_amt
                });
            }

            {
                // if user has voted and is not mong voters for this current nft then he cannot vote here
                // if user has not voted, or user is among voters for this nft then he can vote again to increase his cast/vote
                if(!hasVoted_ && !amongVoters) setCanVote(true);
                else if(hasVoted_ && !amongVoters) setCanVote(false);
                else setCanVote(amongVoters || true);
            }

            setStakers({ data: stakes_mapped, loaded: true });

            let eligibility = "not-eligible";
            for(let i = 0; i < 3 && i < sorted_stakes.length; i++) {
                if(sorted_stakes[i].staker === contract.address) {
                    eligibility = "eligible";
                    setIsTopThree(true);
                    const minterContractInstance = await createMinterContractInstance(contract.signer);
                    const claimed = await minterContractInstance.hasClaimed(g_id);
                    setIsClaimed(claimed);
                    break;
                }
            }
            setClaimable(eligibility);

            getStakersChartData(stakes);
            
            setStakersLoading(false);
        } catch (err) {
            console.log(err);
            if(!noLoading) setStakers({ ...stakers, error: true });
            else setMessageFn(setMessage, { status: 'error', message: 'Network error.' });
            setStakersLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    const fetchMoreAssets = async (routeChanged = false) => {
        try {
            setMoreAssetsLoading(true);
            if(!routeChanged) setMoreAssets({ ...moreAssets, error: false });
            else setMoreAssets({ data: [], error: false, loaded: false }); // routeChanged means new nft_id, so setloaded to false
            // so it does not appear like we have loaded current nft_id data as previous one is loaded already

            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            // returns tuple lst index of raw nft(Uint256) and lst index of accepted nft(Uint256);
            // use the accepted nft own
            const lst = await nftLibraryContractInstance.nftListLen(g_id);
            const index = [];
            for(let i = 1; i <= lst[1]; i++) {
                if(index.length === 5) break;
                if(i == nft_id) continue;
                index.push(i);
            };
            const m_data = await Promise.all(
                index.map((i) => fetchNftData_(i, nftLibraryContractInstance, nftSubmitContractInstance).then(res => res))
            );
            setMoreAssets({ data: m_data, loaded: true, error: false });
            setMoreAssetsLoading(false);
        } catch (err) {
            console.log(err);
            setMoreAssets({ ...moreAssets, error: true });
            setMoreAssetsLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    const fetchData = async (routeChanged = false) => {
        if(!nft.metadata || routeChanged) fetchNftData();
        // idea is that we can be coming from userProfile page viewing an accept that might have not been accepted
        // in that case we only want to display the nft data only
        if(!status || status === "Accepted") {
            if(!stakers.loaded || routeChanged) fetchStakers(routeChanged);
            if(!moreAssets.loaded || routeChanged) fetchMoreAssets(routeChanged);
        } 
    };

    useEffect(() => {
        fetchData(true);
    }, [String(n_id)]);

    useEffect(() => {
        // clean up timeInterval
        return () => timerRef.current && clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if(fetchNewStakers) fetchStakers(false, true);
    }, [fetchNewStakers]);

    useEffect(() => {
        if(gallery.votingEnd) {
            
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
                // because if any is more than 20 mins, then we should just leave with results from 
                // useMemo -> canStake and isClaimTime below, which would have picked up the time on mount
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
                    setLiveUpdate("ended");
                    update_ = "ended";
                    setClaimTime(true); // for end_timer <= 0
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
    
    useResizeThrottle(setWidth);

    const getAddress = useCallback((addy) => {
        if(width < 550) {
            let r = 6;
            if(width <= 450 && width > 399) r = 4;
            return addy.slice(0, r) + "..." + addy.slice(-(r-1));
        }
        let mul = 0.021;
        if(width <= 600 && width >= 550) mul = 0.02;
        const v = Math.floor((width * mul) / 2);
        return addy.slice(0, v + 3) + '...' + addy.slice(-v);
    }, [width]);

    const isError = useCallback((name) => {
        if(name === "stakers") return stakers.error;
        else return moreAssets.error;
    }, [stakers.error, moreAssets.error]);

    const dropdownClick = useCallback((index) => {
        const newArr = [...dropdowns];
        newArr[index] = !newArr[index];
        setDropdowns(newArr);
    }, [dropdowns.join("")]);

    const buttonStClick = useCallback(() => setStakeForm(true), []);
    const buttonLbClick = useCallback(() => setRoute("leaderboard"), []);

    const getFullDateWithTime_ = useCallback((galla) => {
        if(nftLoading || error) return "";

        if(galla) return getFullDateWithTime(gallery.votingEnd, 1000);
        else return getFullDateWithTime(nft.metadata.createdAt || (new Date("19 Feb 2025").getTime()));

    }, [nftLoading, error, gallery.votingEnd, nft.metadata]);

    const shortenAddy_ = useMemo(() => {
        if(!nft.creator) return "";
        return shortenAddy(nft.creator);
    }, [nft.creator]);

    const showViews = useMemo(() => {
        if(!status) return true;
        return (!status || status === "Accepted");
    }, [status]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch(err) {
            console.log(err);
        }
    }, [url]);

    const isClaimTime = useMemo(() => {
        if(claimTime) return true;
        if(!gallery.votingEnd) return false;
        else return (new Date().getTime() / 1000 >= gallery.votingEnd || claimTime);
    }, [gallery.votingEnd, claimTime]);

    const canStake = useMemo(() => {
        if(!canVote) return false;
        if(liveUpdate === "live") return true;
        if(liveUpdate === "ended") return false;
        const d = (new Date().getTime() / 1000);
        if(!gallery.votingEnd) return false;
        else return d >= gallery.votingStart && d < gallery.votingEnd; // since votingEnd is in seconds
    }, [canVote, gallery.votingEnd, liveUpdate]);

    const timing = useMemo(() => {
        if(!timer) return { mins: 0, secs: 0 };
        const Z_ = (v) => v > 9 ? v : `0${v}`;
        return { mins: Z_(Math.floor(timer / 60)), secs: Z_(Math.floor(timer % 60)) };
    }, [timer]);

    const buttonClaimClick = useCallback(async () => {
        try {
            if(claimable !== "eligible") {
                const stakeContractInstance = await createStakeContractInstance(contract.signer);
                const vote_pos = await stakeContractInstance.getPosition(g_id, n_id, contract.address);
                setClaimable(vote_pos < 4 ? "eligible" : "not-eligible");
                setIsTopThree(vote_pos < 4);
                if(vote_pos > 4)  {
                    return setMessageFn(setMessage, { status: 'error', message: 'You are not eligible to claim.' });
                }
            } 

            if(isClaimed) return setMessageFn(setMessage, { status: 'error', message: 'You have claimed before.' });

            if(claimLoading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            setClaimLoading(true);
            const minterContractInstance = await createMinterContractInstance(contract.signer);
            const txn = await minterContractInstance.claimSft(g_id, n_id);
            await txn.wait(); 
            setClaimLoading(false);
            setIsClaimed(true);
            setModal("success");
            setSuccessModalText("You have claimed your reward successfully.");
        } catch (err) {
            // console.log(err);
            setClaimLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    }, [g_id, n_id, contract.signer, isClaimed, claimLoading, claimable]);

    const successFn = useCallback(() => {
        setStakeForm(false); 
        setFetchNewStakers(new Date().getTime());
        setSuccessModalText("You have staked successfully."); 
        setModal("success"); 
    }, []);

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
                <ErrorPage fireFn={error === true ? fetchData : navBackError} 
                text={error === true ? null : error} btnTxt={"Go back"} />
            </div>
            :
            (
            route !== "leaderboard" ?
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
                            <div className='asset'>
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
                                            {/* <span>~ {getPriceInEth(gallery.minStakingAmount, wallet.ethPrice)} ETH</span> */}
                                        </div>
                                        {/* {(console.log(isClaimTime, canStake))} */}
                                        {
                                            // since only buttons are displayed below and they point to 
                                            // fufil actions that need stakers data, so if there is error
                                            // just don't display them, nft data is still displayed already
                                            isError("stakers") ?
                                            <span></span>
                                            :
                                            (
                                                stakersLoading ?
                                                <div className='apd-btns w-full'>
                                                    <div className='apd-btns-loading'><Skeleton /></div>
                                                </div>
                                                :
                                                (
                                                    !showViews ?
                                                    <div className='apd-btns w-full'>
                                                        <button className='apd-btn buy-btn pointer w-full' onClick={() => navigate(-1)}>
                                                            <MdArrowBack className='apdb-icon' />
                                                            <span>Go back</span>
                                                        </button>
                                                    </div>
                                                    :
                                                    <div className='apd-btns w-full'>

                                                        {(isClaimTime === false && canStake) && <button className='apd-btn buy-btn pointer' 
                                                        onClick={buttonStClick}>
                                                            <BsTag className='apdb-icon' />
                                                            <span>Stake now</span>
                                                        </button>}

                                                        {isClaimTime && <button 
                                                        className={`apd-btn buy-btn ${isClaimed||!isTopThree?"false":"true"} pointer`} 
                                                        onClick={buttonClaimClick}>
                                                            <BsTag className='apdb-icon' />
                                                            <span>
                                                                {isClaimed ? "Claimed" : claimLoading ? "Claiming..." : "Claim now"}
                                                            </span>
                                                        </button>}

                                                        <button className='apd-btn ldb-btn pointer' onClick={buttonLbClick}>
                                                            <MdOutlineLeaderboard className='apdb-icon txt-white' />
                                                            <span className="txt-white">Leaderboard</span>
                                                        </button>
                                                    </div>
                                                )
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                            {showViews && <div className='nft-content-box price-chart-div'>
                                <div className="price-chart-top">
                                    <SlGraph className='pct-icon txt-white' />
                                    <span className='txt-white'>Stake history for last 20 days (amount in $NOVA)</span>
                                </div>
                                <div className='price-chart'>
                                    {
                                        isError("stakers") ?
                                        <div className='pc-loading'>
                                            <div>
                                                <p className='txt-white'>Error loading data. Check internet and Try again</p>
                                                <button className='nftce-btn pointer' onClick={() => fetchData()}>Reload</button>
                                            </div>
                                        </div>
                                        :
                                        (
                                            (stakersLoading || !chart.loaded) ?
                                            <div className='pc-loading'>
                                                <LoadingSpinner width={"21px"} height={"21px"} />
                                            </div>
                                            :
                                            (
                                                (chart.loaded && stakers.data.length === 0) ?
                                                <div className='stakers-no-data'>
                                                    <NoData text={"No Staker yet"} />
                                                </div>
                                                :
                                                <ChartComponent datasets={chart.dataset} labels={chart.labels}  
                                                smallSize={true} legend={false} radius={2.4} changed={chart.changed} />
                                            )
                                        )
                                    }
                                </div>
                            </div>}
                        </div>}

                        <div className={`nft-content left-c ${showTimer ? "high-margin" : "margin-up"}`}>

                            {nftLoading && <div className="nft-content-box">
                                <div className='nft-content-box-loading set-height'>
                                    <LoadingSpinner width={"42px"} height={"42px"} />
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
                                        <span className='txt-white nf-desc'>{nft.metadata.description}</span>
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
                        </div>
                        
                        {showViews && <div className='nft-content right-c m-6'>
                            {
                                isError("stakers") ?
                                <div className="nft-content-box">
                                    <div className='nft-content-box-loading nft-content-error'>
                                        <p className='txt-white'>Error loading data. Check internet and Try again</p>
                                        <button className='nftce-btn pointer' onClick={() => fetchData()}>Reload</button>
                                    </div>
                                </div>
                                :
                                (
                                nftLoading ? 
                                <div className="nft-content-box">
                                    <div className='nft-content-box-loading r-set-height'>
                                        <LoadingSpinner width={"42px"} height={"42px"} />
                                    </div>
                                </div>
                                :
                                <div className='nft-content-box'>
                                    <div className="stakers-top-r">
                                        <div className='stakers-tl'>
                                            <FaList className='str-icon txt-white' />
                                            <span className='txt-white'>Stakers</span>
                                        </div>
                                        <div className="stakers-btn pointer txt-white">View more</div>
                                    </div>
                                    <div className='stakers-main-r w-full'>
                                        <ul>
                                            <li className='smr-li header'>
                                                <span className='txt-white'>Amount</span>
                                                {/* <span className='txt-white amt-usd'>Amt in USD</span>
                                                <span className='txt-white floor-diff'>Floor Diff.</span> */}
                                                <span className='txt-white'>Date</span>
                                                <span className='txt-white'>From</span>
                                            </li>
                                            {
                                                stakersLoading ?
                                                skeletons.map((staker, idx) => (
                                                    <li className='smr-li' key={`staker-${idx}`}>
                                                        <span className='txt-white smr-amount loading'>
                                                            <Skeleton />
                                                        </span>
                                                        <span className='txt-white loading'><Skeleton /></span>
                                                        <span className='staker-link loading'>
                                                            <Skeleton />
                                                        </span>
                                                    </li>
                                                ))
                                                :
                                                (
                                                    stakers.data.length === 0 ?
                                                    <div className='stakers-no-data'>
                                                        <NoData text={"No Staker yet"} />
                                                    </div>
                                                    :
                                                    stakers.data.map((staker, idx) => (
                                                        <li className='smr-li' key={`staker-${idx}`}>
                                                            <span className='txt-white smr-amount'>
                                                                {staker.stake_amount} NOVA
                                                            </span>
                                                            <span className='txt-white'>
                                                                {getFullDateWithTime(staker.date, 1000)}
                                                            </span>
                                                            <span className='staker-link'>
                                                                <Link to={`/app/account/${staker.staker}`} className='smr-staker'>
                                                                    {shortenAddy(staker.staker)}
                                                                </Link>
                                                            </span>
                                                        </li>
                                                    ))
                                                )
                                            }
                                        </ul>
                                    </div>
                                </div>
                                )
                            }
                        </div>}
                    </div>

                    {showViews && <>
                      {
                        isError("moreAssets") ?
                        <div className='nft-content-more'>
                            <div className='sales-time-'>
                                <PiGridNineBold className='st-icon txt-white' />
                                <span className="txt-white">More Suggestions</span>
                            </div>
                            <div className='ncm w-full'>
                                <div className='nft-content-box-loading nft-content-error'>
                                    <p className='txt-white'>Error loading data. Check internet and Try again</p>
                                    <button className='nftce-btn pointer' onClick={() => fetchData()}>Reload</button>
                                </div>
                            </div>
                        </div>
                        :
                        (
                        moreAssetsLoading ?
                        <div className='nft-content-more'>
                            <div className='sales-time-'>
                                <PiGridNineBold className='st-icon txt-white' />
                                <span className="txt-white">More Suggestions</span>
                            </div>
                            <div className='ncm w-full'>
                                {moreAssetsLoading && <div className='nft-content-box-loading ncm-height'>
                                    <LoadingSpinner width={"42px"} height={"42px"} />
                                </div>}
                            </div>
                        </div>
                        :
                        (
                            moreAssets.data.length > 0 ?
                            <div className='nft-content-more'>
                                <div className='sales-time-'>
                                    <PiGridNineBold className='st-icon txt-white' />
                                    <span className="txt-white">More Suggestions</span>
                                </div>
                                <div className='ncm w-full'>
                                    <div className='ncm-overflow'>
                                        <div className='ncmo'>
                                            <div className='ncm-max-content'>
                                                {moreAssets.data.map((asset, idx) => (
                                                    <div key={`ncm-li-${idx}`} className='ncm-li'>
                                                        <Link to={`/app/asset/${asset.nft_library_id}/${gallery_id}`} 
                                                        className='ncml-div pointer w-full'>
                                                            <div className='ncmld-Art w-full'>
                                                                <NFTGridImage nft={asset} loading={moreAssetsLoading} scrollPosition={null} />
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ncm-base">
                                    <Link to={{
                                        pathname: `/app/gallery/${gallery_id}`,
                                        state: { galleryData: { ...gallery, gallery_id } }
                                    }}>
                                        <button className='ncmb-btn pointer txt-white'>
                                            View gallery
                                        </button>
                                    </Link>
                                </div>
                            </div>
                            :
                            <div className='nft-content-more'>
                                <div className="ncm-base">
                                    <Link to={{
                                        pathname: `/app/gallery/${gallery_id}`,
                                        state: { galleryData: { ...gallery, gallery_id } }
                                    }}>
                                        <button className='ncmb-btn pointer txt-white'>
                                            View gallery
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        )
                        )
                      }
                    </>}
                </div>
            </div> 
            :
            <LeaderBoard data={{}} closePage={() => setRoute("")} g_id={g_id} n_id={n_id} stakers={stakers.data||[]}
            getAddress={getAddress} width={width} minimumStakeAmt={gallery.minStakingAmount} nft_data={nft.metadata} />
            )
        }

        {stakeForm && <StakeForm n_id={n_id} nft={nft} g_id={g_id} stakers={stakers.data||[]} successFn={successFn}
        minStakingAmount={gallery.minStakingAmount} closeModal={() => setStakeForm(false)} gallery={gallery} canVote={canVote} />}

        {modal === "success" && <SuccessModal closeModal={() => setModal("")} text={succesModalText} />}

        </div>
    )
};

export default NftAsset;