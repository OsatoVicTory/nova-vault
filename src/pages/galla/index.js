// import '../home/styles.css';
import './gallery.css';
import { IoIosCopy } from "react-icons/io";
import { BsDot, BsGrid, BsList, BsPlusSquare } from "react-icons/bs";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NFTFlexImage, NFTGridImage } from '../../components/renderImage/nftImage';
import { AppContext } from '../../context';
import { Skeleton } from '../../components/loading';
import NoData from '../../components/noData';
import ErrorPage from '../../components/error';
// import { fakeGallery } from '../../fakeDatas';
import { getDateWithoutTime, getPeriod, parseAmount, parseGalleryData, parseNftMetaData, setMessageFn, shortenAddy } from '../../utils';
import { createGalleryContractInstance, createNftLibraryContractInstance, createNftSubmitContractInstance, multiplyBigDecimals, parseBigInt } from '../../services/creators';
import useGetToolTip from '../../hooks/useGetToolTip';
import { FaCheck } from 'react-icons/fa6';
import BuyTicket from './buyTicket';
import SuccessModal from '../../components/modals/success';
import { COUNTDOWN_PERMIT, COUNTDOWN_REVEAL_TIME } from '../../config';

const Gallery = () => {

    const navigate = useNavigate();
    const { scrollPosition, contract, setMessage } = useContext(AppContext);
    const [route, setRoute] = useState("Accepted");
    const [search, setSearch] = useState('');
    const [listType, setListType] = useState("Grid");
    const [showMore, setShowMore] = useState(false);
    const [gallery, setGallery] = useState({});
    const [copied, setCopied] = useState(false);
    const [metaDataLoading, setMetaDataLoading] = useState(true);
    const [galleryError, setGalleryError] = useState(false);
    const [isMember, setIsMember] = useState({ state: false, loaded: false });
    const [modal, setModal] = useState("");
    const [liveUpdate, setLiveUpdate] = useState(false);
    const timerRef = useRef();

    const [nfts, setNfts] = useState({ data: [], loaded: false });
    const [nftLoading, setNftLoading] = useState(true);
    const [nftsError, setNftsError] = useState(false);

    const [nftsRejectedAndSubmited, setNftsRejectedAndSubmited] = useState({ rejected: [], review: [], loaded: false });
    const [nftsRejectedAndSubmitedLoading, setNftsRejectedAndSubmitedLoading] = useState(false);
    const [nftsRejectedAndSubmitedError, setNftsRejectedAndSubmitedError] = useState(false);

    const { gallery_id } = useParams();
    const { state } = useLocation();
    const ownerRef = useRef();
    const notExist = "Gallery does not exist";

    const url = window.location.href;

    const skeletons = Array(8).fill(0);

    const fetchGalleryMetaData = async () => {
        try {
            setMetaDataLoading(true);
            setGalleryError(false);

            if(state?.galleryData?.name) {
                setGallery({ ...state.galleryData, gallery_id });
            } else {
                const contractInstance = await createGalleryContractInstance(contract.signer);
                const data = await contractInstance.getGallery(parseBigInt(gallery_id));
                if(!data) throw new Error(notExist);
                const g = parseGalleryData(data);
                // console.log("gallery", g, String(new Date(Number(g.votingEnd))));
                setGallery({ ...parseGalleryData(data), gallery_id });
            }
            setMetaDataLoading(false);
        } catch(err) {
            console.log(err);
            setMetaDataLoading(false);
            setGalleryError(err === notExist ? err : true);
            setMessageFn(setMessage, { 
                status: 'error', 
                message: 'Network error or you might be making too many requests. Try again and be patient while loading.' 
            });
        } 
    };

    const fetchNftData = async (index, nftLibraryContractInstance, nftSubmitContractInstance, checker = false) => {
        const g_id = parseBigInt(gallery_id);
        const n_id = parseBigInt(index);

        const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, checker);
        const nft_id = String(nft_metadata_id[2]);
        // console.log("nft_metadata_id", nft_metadata_id);
        // return { ...res, type: nft_metadata_id[1] }
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id[2]); // ft_metadata_id[2]);
        // console.log("nft_id", nft_data, "n_id", n_id);
        const res = { ...parseNftMetaData(nft_data), nft_library_id: String(n_id), nft_id };
        if(checker) {
            // const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, true);
            // console.log("nft_metadata_id", nft_metadata_id);
            return { ...res, type: String(nft_metadata_id[1]) }
        } else return res;
    };

    const fetchGalleryNfts = async () => {
        try {
            setNftsError(false);
            setNftLoading(true);
            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            // returns tuple lst index of raw nft(Uint256) and lst index of accepted nft(Uint256);
            // use the accepted nft own
            const lst = await nftLibraryContractInstance.nftListLen(parseBigInt(gallery_id));
            // console.log(lst)
            const data = await Promise.all(
                Array((lst[1] + "") - 0).fill(0).map((v, i) => {
                    return fetchNftData(i + 1, nftLibraryContractInstance, nftSubmitContractInstance).then(res => res);
                })
            );
            // console.log("nfts", data);
            setNfts({ data, loaded: true }); 
            setNftLoading(false);
        } catch(err) {
            console.log(err);
            setNftsError(true);
            setNftLoading(false);
            setMessageFn(setMessage, { 
                status: 'error', 
                message: 'Network error or you might be making too many requests. Try again and be patient while loading.' 
            });
        } 
    };

    const fetchGalleryRejectedAndSubmitedNfts = async () => {
        try {
            setNftsRejectedAndSubmitedError(false);
            setNftsRejectedAndSubmitedLoading(true);
            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            // returns tuple lst index of raw nft(Uint256) and lst index of accepted nft(Uint256);
            // use the accepted nft own
            const lst = await nftLibraryContractInstance.nftListLen(parseBigInt(gallery_id));
            // console.log("lst", lst, gallery_id);
            const data = await Promise.all(
                Array((lst[0] + "") - 0).fill(0).map((v, i) => {
                    return fetchNftData(i + 1, nftLibraryContractInstance, nftSubmitContractInstance, true).then(res => res);
                })
            );
            // console.log("nfts", data);
            const rej = [], rev = [];
            for(const d of data) {
                // d.type is already string
                if(d.type === "2") rej.push(d);
                else if(d.type === "0") rev.push(d);
            }
            setNftsRejectedAndSubmited({ rejected: rej, review: rev, loaded: true }); 
            setNftsRejectedAndSubmitedLoading(false);
        } catch(err) {
            console.log(err);
            setNftsRejectedAndSubmitedError(true);
            setNftsRejectedAndSubmitedLoading(false);
            setMessageFn(setMessage, { 
                status: 'error', 
                message: 'Network error or you might be making too many requests. Try again and be patient while loading.' 
            });
        } 
    };

    const fetchGalleryData = () => {
        if(!gallery.name) fetchGalleryMetaData();
    };

    const fetchNfts = async () => {
        try {
            if(!isMember.state && !isMember.loaded) {
                setNftLoading(true);
                setNftsError(false);
                const contractInstance = await createGalleryContractInstance(contract.signer);
                const isMember_ = await contractInstance.getUserStatus(parseBigInt(gallery_id), contract.address);
                setIsMember({ state: isMember_, loaded: true });
                setNftLoading(false);
            } else {
                if(route === "Accepted") !nfts.loaded && fetchGalleryNfts();
                else !nftsRejectedAndSubmited.loaded && fetchGalleryRejectedAndSubmitedNfts();
            }
        } catch(err) {
            setNftLoading(false);
            setNftsError(true);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    useEffect(() => {
        fetchGalleryData();

        return () => timerRef.current && clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        fetchNfts();
    }, [route, isMember.state]);

    useGetToolTip(ownerRef, gallery.owner, [metaDataLoading]);

    const handleChange = useCallback((e) => {
        setSearch(e.target.value);
    }, []);

    const scrolled = useMemo(() => {
        return scrollPosition.y >= 270;
    }, [scrollPosition.y]);

    const navToCreate = useCallback(() => {
        if(nftLoading || nftsError) return;
        // add state
        navigate(`/app/create/asset`, { state: { galleryData: gallery } });
    }, [nftLoading, nftsError]);

    const shortenAddy_ = useMemo(() => {
        if(gallery.owner) return shortenAddy(gallery.owner);
        else return "";
    }, [gallery.owner]);

    const clxFn = useMemo(() => {
        if(!nftLoading && !nftsError) return "pointer";
        else return "";
    }, [nftLoading, nftsError]);

    // const image_banner = "https://i.seadn.io/gcs/files/642de8fe6f7326fe571351f5ed77e16b.jpg?auto=format&dpr=1&w=1920";

    const curData = useMemo(() => {
        if(route === "Accepted") return { ...nfts, loading: nftLoading, error: nftsError, route };
        else if(route === "Rejected") return { 
            data: nftsRejectedAndSubmited.rejected, loading: nftsRejectedAndSubmitedLoading, 
            loaded: nftsRejectedAndSubmited.loaded, error: nftsRejectedAndSubmitedError, route  
        };
        else return { 
            data: nftsRejectedAndSubmited.review, loading: nftsRejectedAndSubmitedLoading, 
            loaded: nftsRejectedAndSubmited.loaded, error: nftsRejectedAndSubmitedError, route  
        };
    }, [
        route, nftLoading, nftsRejectedAndSubmitedLoading
    ]);

    const displayableData = useMemo(() => {
        // console.log(curData);
        if(!search) return curData.data;
        else {
            const arr = [];
            const srch = search.toLowerCase();
            for(const nft_ of curData.data) {
                if(nft_.metadata.name?.toLowerCase().includes(srch)) arr.push(nft_);
            }
            return arr;
        }
    }, [search, curData.route, curData.loading]);

    const isAdmin = useMemo(() => {
        // console.log(contract.address, gallery.owner);
        if(gallery.owner) return gallery.owner === contract.address;
        else return false;
    }, [gallery.owner]);

    const fireFn = useCallback(() => {
        if(galleryError === notExist) navigate(`/app`);
        else fetchGalleryData();
    }, [galleryError]);

    const shouldAddMore = useMemo(() => {
        if(gallery?.metadata) {
            const { innerWidth } = window;
            let mul = 0.5;
            if(innerWidth <= 1030) mul = 0.74;
            return (mul * innerWidth) <= (6.4 * (gallery.metadata.description||"").length);
        } else return false;
    }, [gallery?.metadata]);

    const parseAmount_ = useMemo(() => {
        if(nftsError) return "";
        else if(nftLoading) return "...";
        return nfts.loaded ? parseAmount(nfts.data.length) : "0";
    }, [nfts.data.length, nftsError, nftLoading]);

    const parseAttendees_ = useMemo(() => {
        return gallery.attendees ? parseAmount(gallery.attendees) : "0";
    }, [gallery.attendees]);

    const getDateWithoutTime_ = useMemo(() => {
        if(gallery.createdAt) return getDateWithoutTime(gallery.createdAt, 1000);
        else return "";
    }, [gallery.createdAt]);

    const getTotalVolume = useMemo(() => {
        if(gallery.name && nfts.loaded) {
            return parseAmount(multiplyBigDecimals(nfts.data.length, gallery.minStakingAmount));
        } else return "";
    }, [gallery.name, nfts.loaded]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch(err) {
            console.log(err);
        }
    };

    const successFn = useCallback(() => {
        setIsMember({ state: true, loaded: true });
        setModal("success");
    }, []);

    const canCreateNewNft = useMemo(() => {
        if((liveUpdate||"").startsWith("ends")) return false; // it is counting down till end so voting has started
        if(liveUpdate === "live" || liveUpdate === "ended") return false;
        const d = (new Date().getTime() / 1000);
        if(!gallery.votingStart) return false;
        else return d < gallery.votingStart; // since votingEnd is in seconds
    }, [gallery.votingStart, liveUpdate]);

    useEffect(() => {
        if(gallery.votingEnd) {
            // console.log(
            //     String(new Date((gallery.votingStart-0) * 1000)), 
            //     String(new Date((gallery.votingEnd-0) * 1000))
            // );
            // timer timing till votingStart and votingEnd to notify user accordingly
            let d_timer = (gallery.votingStart - (new Date().getTime() / 1000));
            let end_timer = (gallery.votingEnd - (new Date().getTime() / 1000));
            let update_ = false, f_ = "";
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
                // useMemo -> votingState below
                if((d_timer > 0 && d_timer <= COUNTDOWN_REVEAL_TIME) || (end_timer > 0 && end_timer <= COUNTDOWN_REVEAL_TIME)) {
                    const q_ = (d_timer > 0 && d_timer <= COUNTDOWN_REVEAL_TIME) ? `starts in ${getPeriod(gallery.votingStart)}` : `ends in ${getPeriod(gallery.votingEnd)}`;
                    if(q_ !== f_) {
                        setLiveUpdate(q_);
                        f_ = q_;
                    }
                } else {
                    if(d_timer <= 0 && end_timer > 0 && update_ !== "live") {
                        setLiveUpdate("live");
                        update_ = "live";
                    } else if(end_timer <= 0 && update_ !== "ended") {
                        setLiveUpdate("ended");
                        update_ = "ended";
                    }
                }

                if((d_timer <= 0 || d_timer > COUNTDOWN_PERMIT) && (end_timer <= 0 || end_timer > COUNTDOWN_PERMIT)) { 
                    clearTimeout(timerRef.current);
                } 

            }, 1000);  
        }

        return () => timerRef.current && clearInterval(timerRef.current);

    }, [gallery.votingEnd]);

    const votingState = useMemo(() => {
        const d = (new Date().getTime() / 1000);
        if(!gallery.votingStart) return false;
        else if(liveUpdate === "live" || (liveUpdate||"").startsWith("starts") || (liveUpdate||"").startsWith("ends")) {
            return liveUpdate;
        } else if(liveUpdate === "ended") return "ended";
        else if(gallery.votingStart > d) return `starts in ${getPeriod(gallery.votingStart)}`;
        else if(d > gallery.votingStart && d < gallery.votingEnd) return "live";
        else return "ended";
    }, [gallery.votingStart, liveUpdate]);

    return (
        <div className="Glry w-full">
        {
            galleryError ?
            <div className="glry-wrapper w-full">
                <ErrorPage fireFn={fireFn} text={galleryError === notExist ? galleryError : null} />
            </div>
            :
            <div className="glry-wrapper w-full">
                <div className={`glry-head-scrl w-full`}>
                    <div className={`glry-header w-full`}>
                        <div className="gh-with-banner w-full">
                            <div className="ghwb-absolute w-full h-full">
                                {
                                    metaDataLoading ?
                                    <div className="ghwb-img w-full h-full loading"></div>
                                    :
                                    <div className="ghwb-img w-full h-full" 
                                    style={{backgroundImage: `url(${gallery?.metadata?.banner_img})`}}></div>
                                }
                                <div className="ghwb-cloak w-full h-full"></div>
                            </div>
                            <div className="ghwb-main w-full">
                                <div className="ghwb w-full">
                                    <div className="ghwb-profile">
                                        {!metaDataLoading && <div className='ghwbp'>
                                            <img src={gallery?.metadata?.img} alt='' />
                                            <div className="ghwbp-txt">
                                                <span className="ghwbp-name">{gallery.name}</span>
                                                <span className="ghwbp-aff pointer" ref={ownerRef}>{shortenAddy_}</span>
                                            </div>
                                        </div>}

                                        {metaDataLoading && <div className='ghwbp'>
                                            <div className='ghwbp-img-loading'></div>
                                            <div className="ghwbp-txt">
                                                <span className="ghwbp-name loading"><Skeleton /></span>
                                                <span className="ghwbp-aff loading"><Skeleton /></span>
                                            </div>
                                        </div>}

                                    </div>

                                    {nftLoading && <div className="ghwb-stats">
                                        <div className='ghwbss loading'><Skeleton /></div>
                                        <div className="ghw-copy">
                                            <div className='ghwcopy-loading'>
                                                <Skeleton />
                                            </div>
                                        </div>
                                    </div>}

                                    {!nftLoading && <div className="ghwb-stats">
                                        <div>
                                            <div className="ghwb-stat">
                                                <span className="ghwbs-value">{gallery.price} NOVA</span>
                                                <span className="ghwbs-name">Gallery price</span>
                                            </div>
                                            {isMember.state && <div className="ghwb-stat">
                                                <span className="ghwbs-value">{getTotalVolume} NOVA</span>
                                                <span className="ghwbs-name">Total volume</span>
                                            </div>}
                                            <div className="ghwb-stat">
                                                <span className="ghwbs-value">{gallery.minStakingAmount} NOVA</span>
                                                <span className="ghwbs-name">Min. Stake Amount</span>
                                            </div>
                                        </div>
                                        <div className="ghw-copy">
                                            <div>
                                                <div className="ghw-copy-abs">Copy this gallery url</div>
                                                <div className="ghwc pointer">
                                                    <IoIosCopy className='ghwc-icon' />
                                                </div>
                                            </div>
                                        </div>
                                    </div>}
                                    
                                </div>
                            </div>
                        </div>
                        <div className="gh-without-banner w-full">
                            {metaDataLoading && <div className='ghwb-description'>
                                <div className='ghwb-des w-full'>
                                    <div className="ghwbdes-loading txt-white">
                                        <Skeleton />
                                    </div>
                                    <div className="ghw-copy">
                                        <div className='ghwcopy-loading'>
                                            <Skeleton />
                                        </div>
                                    </div>
                                </div>
                                <div className='ghwb-desc'>
                                    <div className='w-full'>
                                        <div className='ghwbdesc-loading'><Skeleton /></div>
                                        <div className='ghwbdesc-loading m-5'><Skeleton /></div>
                                    </div>
                                </div>
                            </div>}

                            {!metaDataLoading && <div className='ghwb-description'>
                                <div className='ghwb-des w-full'>
                                    <div className="txt-white">
                                        Items<span>{parseAmount_}</span>
                                        <BsDot className='ghwbd-icon' />
                                        Created<span>{getDateWithoutTime_}</span><BsDot className='ghwbd-icon' />
                                        Attendees<span>{parseAttendees_}</span><BsDot className='ghwbd-icon ghwbd-icon-last-child' />
                                        {votingState && <span className='txt-white vote-icon enough-width-space'>
                                            <span className="txt-white">
                                                {`Voting ${votingState}`}
                                            </span>
                                            {votingState === "live" && <div className="pulser">
                                                <div className='pulse-abs-container'>
                                                    <div className='pulse1'></div>
                                                    <div className='pulse2'></div>
                                                    <div className='pulse3'></div>
                                                    <div className={`no-pulse`}></div>
                                                </div>
                                            </div>}
                                        </span>}
                                    </div>
                                    <div className="ghw-copy">
                                        <div>
                                            <div className="ghw-copy-abs">
                                                {`${copied ? "Copied" : "Copy this gallery url"}`}
                                            </div>
                                            <div className="ghwc-url txt-white">{url}</div>
                                            <div className="ghwc pointer" onClick={handleCopy}>
                                                {
                                                    copied ?
                                                    <FaCheck className='ghwc-icon txt-white' />
                                                    :
                                                    <IoIosCopy className='ghwc-icon txt-white' />
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {votingState && <span className='txt-white vote-icon not-enough-width-space'>
                                    <span className="txt-white">
                                        {`Voting ${votingState}`}
                                    </span>
                                    {votingState === "live" && <div className="pulser">
                                        <div className='pulse-abs-container'>
                                            <div className='pulse1'></div>
                                            <div className='pulse2'></div>
                                            <div className='pulse3'></div>
                                            <div className={`no-pulse`}></div>
                                        </div>
                                    </div>}
                                </span>}
                                {gallery?.metadata?.description && <div className='ghwb-desc'>
                                    <div className='and-g w-full'>
                                        <span className={`and-span txt-white ${showMore}`}>{gallery.metadata.description}</span>
                                        {shouldAddMore && <span className={`g-and-more ${!showMore} txt-white pointer`} 
                                        onClick={() => setShowMore(true)}>See more</span>}
                                    </div>
                                </div>}
                            </div>}
                        </div>
                    </div>
                </div>

                {(!nftLoading && !isMember.state && !nftsError) ?
                <BuyTicket gallery_id={gallery_id} gallery={gallery} successFn={successFn}  />
                :
                <div className="glry-main w-full">
                    <div className='glm-wrapper w-full'>
                        <div className={`glm-head-container ${scrolled} w-full`}>
                            {!metaDataLoading && <div className={`glry-header- w-full`}>
                                <div className='glryh'>
                                    <img src={gallery?.metadata?.img} data-nimg="fill" alt='' />
                                    <span className="glryh-name txt-white">{gallery.name}</span>
                                    <div className="ghw-copy">
                                        <div>
                                            <div className="ghw-copy-abs at-bottom">
                                                {`${copied ? "Copied" : "Copy this gallery url"}`}
                                            </div>
                                            <div className="ghwc pointer" onClick={handleCopy}>
                                                {
                                                    copied ?
                                                    <FaCheck className='ghwc-icon' />
                                                    :
                                                    <IoIosCopy className='ghwc-icon' />
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>}

                            {isAdmin && <div className="ah-routes">
                                <button className={`ahr-btn ${route === "Accepted"} txt-white pointer`}
                                onClick={() => setRoute("Accepted")}>{`Accepted`}</button>
                                <button className={`ahr-btn ${route === "In-Review"} txt-white pointer`}
                                onClick={() => setRoute("In-Review")}>{`In-Review`}</button>
                                <button className={`ahr-btn ${route === "Rejected"} txt-white pointer`}
                                onClick={() => setRoute("Rejected")}>{`Rejected`}</button>
                            </div>}

                            <div className='glm-head w-full'>
                                <div className='glmh1'>
                                    <h3 className="txt-white">Gallery</h3>
                                    {
                                        curData.loading ?
                                        <div className='glm-search loading'>
                                            <div className='glm-search-loading'><Skeleton /></div>
                                        </div>
                                        :
                                        <div className='glm-search'>
                                            <AiOutlineSearch className={`glms-icon ${search?true:false} txt-white`} />

                                            <input className={`glms-input ${search?true:false} txt-white`} 
                                            value={search||""} placeholder='Search for an NFT by name' onChange={handleChange} />

                                            <AiOutlineClose className='glms-icon pointer close-icon txt-white'
                                            onClick={() => setSearch("")} />
                                        </div>
                                    }
                                </div>
                                <div className='glmh'>
                                    <div className='shape-btns'>
                                        <button className={`sb-btn pointer ${listType === "Grid"}`} onClick={() => setListType("Grid")}>
                                            <BsGrid className='sbb-icon txt-white' />
                                        </button>
                                        <button className={`sb-btn pointer ${listType === "Flex"}`} onClick={() => setListType("Flex")}>
                                            <BsList className='sbb-icon txt-white' />
                                        </button>
                                    </div>
                                    {/* liveUpdate becomes "live" when voting starts and "ended" when votingEnds, so either way only if its is false can we create new Nft */}
                                    {canCreateNewNft && 
                                    <button className={`add-nft-btn ${clxFn}`} onClick={navToCreate}>
                                        <BsPlusSquare className='anb-icon' />
                                        <span>Add NFT</span>
                                    </button>}
                                </div>
                            </div>
                        </div>

                        {
                        curData.error ?
                        <div className='glm-body w-full'>
                            <ErrorPage fireFn={fetchNfts} />
                        </div>
                        :
                        <div className='glm-body w-full'>
                            {
                                (curData.data.length === 0 && !curData.loading) ?
                                <div className='glm-ul'>
                                    <NoData text={"No Nft created yet.\n Click button below to craete one now"} 
                                    btnTxt={(route === "Accepted" && canCreateNewNft) ? "Add Nft now" : null} 
                                    btnFn={(route === "Accepted" && canCreateNewNft) ? navToCreate : null} />
                                </div>
                                :
                                (
                                    (displayableData.length === 0 && !curData.loading) ?
                                    <div className='glm-ul w-full'>
                                        <NoData text={"No Nft matching search"} />
                                    </div>
                                    :
                                    <ul className={`glm-ul ${listType}`}>

                                        {listType === "Flex" &&
                                            <li className='Art-li first-child'>
                                                <div className="NFTFlexImage w-full nft-flex-header">
                                                    <div className={`nft-flex w-full`}>
                                                        <span className="nft-f-txt t# txt-white">#</span>
                                                        <div className="nft-f-image">
                                                            <span className="nft-f-txt nft-name txt-white">Items</span>
                                                        </div>
                                                        {/* <span className="nft-f-txt nftf-amount txt-white">Floor price</span> */}
                                                        <span className="nft-f-txt txt-white">Owner</span>
                                                        <span className="nft-f-txt txt-white">Date</span>
                                                    </div>
                                                </div>
                                            </li>
                                        }

                                        {curData.loading ? 
                                            skeletons.map((val, idx) => (
                                                <li key={`glm-li-${idx}`} className={`Art-li ${curData.loading && "art-loading"} w-full`}>
                                                    <div className='Art-div w-full'>
                                                        <div className='NFT-Art w-full'>
                                                            {listType === "Grid" ?
                                                                <NFTGridImage nft={val} loading={true} 
                                                                scrollPosition={scrollPosition} hasPrice={false} /> 
                                                                :
                                                                <NFTFlexImage nft={val} loading={true} hasPrice={false}
                                                                clx={"nft-flex"} index={idx} scrollPosition={scrollPosition} />
                                                            }
                                                        </div>
                                                    </div>
                                                </li>
                                            ))
                                            :
                                            displayableData.map((val, idx) => (
                                                <li key={`glm-li-${idx}`} className={`Art-li ${curData.loading && "art-loading"} w-full`}>
                                                    <Link to={{
                                                    pathname:  `/app/asset${route!=="Accepted"?"-review":""}/${val.nft_library_id}/${gallery_id}`,
                                                    state: { nft: { ...val }, gallery } 
                                                    }} className='Art-div pointer w-full'>
                                                        <div className='NFT-Art w-full'>
                                                            {listType === "Grid" ?
                                                                <NFTGridImage nft={val} loading={false}
                                                                hasPrice={false} scrollPosition={scrollPosition} /> 
                                                                :
                                                                <NFTFlexImage nft={val} loading={false} hasPrice={false}
                                                                clx={"nft-flex"} index={idx} scrollPosition={scrollPosition} />
                                                            }
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                )
                            }
                        </div>}
                    </div>
                </div>}
            </div>
        }

        {modal === "success" && <SuccessModal closeModal={() => setModal("")} text={"Bought ticket successfully. You now have access to this gallery"} />}

        </div>
    )
};

export default Gallery;