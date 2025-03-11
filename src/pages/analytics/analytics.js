// import { SlGraph } from "react-icons/sl";
import "./analytics.css";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { AppContext } from "../../context";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AnalyticsHomeLoading from "./homeLoading";
import NoData from "../../components/noData";
import ErrorPage from "../../components/error";
// import { fakeAnalyticsHomeData } from "../../fakeDatas";
import { 
    createGalleryContractInstance, createNftLibraryContractInstance, 
    createNftSubmitContractInstance, createStakeContractInstance, 
    divideBigDecimals, 
    multiplyBigDecimals, 
    parseBigInt, subtractBigDecimals 
} from "../../services/creators";
import { getFullDateWithTime, parseAmount, parseGalleryData, parseIpfsUrl, parseNftMetaData, setMessageFn } from "../../utils";
import { fetchAcceptedNFTs } from "../../services/nfts";
// import { getGalleryAttendeesCntForHomePage } from "../../services/galleryAnalytics";
// import { MdInfoOutline, MdOutlinePerson } from "react-icons/md";
// import { TbDelta } from "react-icons/tb";
// import useGetToolTip from "../../hooks/useGetToolTip";
import NftImageFile from "../../components/renderImage/nftImageFile";
import useResizeThrottle from "../../hooks/useResize";

const AnalyticsHome = () => {
    
    const { scrollPosition, contract, wallet, setMessage } = useContext(AppContext);
    // const [error, setError] = useState(false);
    const [route, setRoute] = useState("Galleries");
    const [width, setWidth] = useState(window.innerWidth);
    // const hovRef = useRef();
    const routeRef = useRef("Galleries");

    const [dataGalleries, setDataGalleries] = useState({ data: [], loaded: false, error: false });
    const [dataGalleriesLoading, setDataGalleriesLoading] = useState(true);

    const [dataCreated, setDataCreated] = useState({ data: [], loaded: false, error: false });
    const [dataCreatedLoading, setDataCreatedLoading] = useState(false);
    
    const fetchGallery = async (index, contractInstance) => {
        const id = await contractInstance.getUc(index, contract.address, 0);
        const res_ = await contractInstance.getGallery(id);
        // const { change, len } = await getGalleryAttendeesCntForHomePage(contract.signer, String(id));
        const g = parseGalleryData(res_);
        const { change, len } = { change: 0, len: g.attendees };
        return { 
            gallery_id: String(id), ...g, img: g.metadata.img, 
            change, len, date: getFullDateWithTime(res_[4], 1000), ch: change > 0 
        };
    };
        
    const fetchGalleriesData = async () => {
        try {
            setDataGalleriesLoading(true);
            setDataGalleries({ ...dataGalleries, error: false });
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const len = String(await contractInstance.getLenUc(contract.address, 0)) - 0;
            const res = await Promise.all(
                Array((len + "") - 0).fill(0).map((v, i) => {
                    return fetchGallery(parseBigInt(i), contractInstance).then(res => res);
                })
            );
            // const res = [];
            // for(let i = 0; i < len; i++) {
            //     const res_ = await fetchGallery(parseBigInt(i), contractInstance);
            //     res.push(res_);
            // }
            setDataGalleries({ data: res, loaded: true, error: false });
            setDataGalleriesLoading(false);
        } catch (err) {
            console.log(err);
            setDataGalleries({ ...dataGalleries, error: true });
            setDataGalleriesLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error or you might be making too many requests. Try again.' });
        }
    };
    
    const fetchNft = async (val, nftLibraryContractInstance, nftSubmitContractInstance) => {
        const n_id = parseBigInt(val.nft_library_id);
        const g_id = parseBigInt(val.gallery_id);

        // false cus it is releasing accepted ones only, and true => raw data which only creators/admin of gallery can view
        const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, false); 
        const nft_meta_data_id = String(nft_metadata_id[2]);
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id[2]); // nft_metadata_id[2]);
        const res = { 
            ...parseNftMetaData(nft_data), gallery_id: String(g_id), 
            nft_library_id: String(n_id), nft_id: String(nft_meta_data_id) 
        };

        const contractInstance = await createStakeContractInstance(contract.signer);
        const len = await contractInstance.getTotalVotes(g_id, n_id);
        const { img, price, createdAt, name, src, file_type } = res?.metadata || {};
        if(len > 0) {
            // const [vote_val] = await contractInstance.getCast(g_id, n_id, len);
            const [vote_val] = [0];
            const price_ = price || 0.001;
            const pr_ = subtractBigDecimals(divideBigDecimals(vote_val, wallet.decimals), price_);
            return { 
                ...res, len: String(len), img, src, file_type,
                date: getFullDateWithTime(createdAt), price, name, ch: pr_ > 0,
                change: parseAmount(multiplyBigDecimals(divideBigDecimals(pr_, price_), 100)), 
            };
        } else {
            return { 
                ...res, len: 0, img, change: 0, price: price || 2, name, src, file_type,
                date: getFullDateWithTime(createdAt || new Date("19 Feb 2025"))
            };
        }
    };
        
    const fetchAssetsData = async () => {
        try {
            setDataCreatedLoading(true);
            setDataCreated({ ...dataCreated, error: false });
            // use accepted only cus it is the only one that will have analytics cus it is d one all users can view to vote
            // and it spits out the library nft_id that we can use to do many things unlike Submited own
            const res_ = await fetchAcceptedNFTs(contract.signer, contract.address);
            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const res = await Promise.all(
                res_.map((val) => {
                    return fetchNft(val, nftLibraryContractInstance, nftSubmitContractInstance).then(res => res);
                })
            );
            // const res = [];
            // for(const val of res_) {
            //     const res_ = await fetchNft(val, nftLibraryContractInstance, nftSubmitContractInstance);
            //     res.push(res_);
            // }
            // console.log("created-res", res);
            setDataCreated({ data: res, loaded: true, error: false });
            setDataCreatedLoading(false);
        } catch (err) {
            console.log("created", err);
            setDataCreated({ ...dataCreated, error: true });
            setDataCreatedLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error or you might be making too many requests. Try again.' });
        }
    };
    
    const fetchData = () => {
        if(route === "Galleries" && !dataGalleries.loaded) fetchGalleriesData();
        if(route === "Assets" && !dataCreated.loaded) fetchAssetsData();
    };

    useEffect(() => {
        fetchData();
    }, [route]);

    useResizeThrottle(setWidth);
    
    const curData = useMemo(() => {
        routeRef.current = route;
        if(route === "Galleries") return { ...dataGalleries, loading: dataGalleriesLoading };
        else return  { ...dataCreated, loading: dataCreatedLoading }
    }, [
        route, dataGalleriesLoading, dataCreatedLoading
    ]);

    // useGetToolTip(
    //     hovRef, 
    //     route === "Galleries" ? "Number of people who joined in last 24 hr" : "Last Staked amount percent difference",
    //     [curData.loading, route]
    // );

    const isMobile = useMemo(() => {
        return width <= 780;
    }, [width]);

    const getNextRoute = useCallback((val) => {
        if(route === "Galleries") return `/app/analytics/gallery/${val.gallery_id}`;
        else return `/app/analytics/asset/${val.nft_library_id}/${val.gallery_id}`;
    }, [route]);

    return (
        <div className="AnalyticsHome w-full">
            <div className="analytics-home-wrapper w-full">
                <h3 className="txt-white">Analytics</h3>
                <div className="analytics-routes">
                    <button className={`analytics-route txt-white ${route==="Galleries"} pointer`}
                    onClick={() => setRoute("Galleries")}>Galleries</button>
                    <button className={`analytics-route txt-white ${route==="Assets"} pointer`}
                    onClick={() => setRoute("Assets")}>Assets</button>
                </div>

                {curData.error && <div className="analytics-contents-error">
                    <ErrorPage fireFn={fetchData} />
                </div>}

                {!curData.error && <>
                {
                    curData.loading ?
                    <AnalyticsHomeLoading route={route} isMobile={isMobile} />
                    :
                    (
                        curData.data.length === 0 ?
                        <div className="analytics-contents-no-data">
                            <NoData text={`No data in your ${route}`} />
                        </div>
                        :
                        <div className="analytics-contents w-full">
                            <ul className="anct-ul">
                                <li className="anct-li w-full t-header">
                                    {!isMobile && <div className="anct-div t-desktop">
                                        <div className="anct-item">
                                            <div className="anct-index txt-white">#</div>
                                            <span className="txt-white">{route}</span>
                                        </div>
                                        <div className="anct-price">
                                            <span className="txt-white">Price (in NOVA)</span>
                                        </div>
                                        {/* <div className="anct-change">
                                            <span className="txt-white">
                                                24hr 
                                                <TbDelta className="anct-change-icon txt-white" />
                                                <span ref={hovRef}>
                                                    <MdInfoOutline className="anct-change-icon pointer txt-white" />
                                                </span>
                                            </span>
                                        </div> */}
                                        <div className="anct-count">
                                            <span className="txt-white">{route === "Galleries" ? "Attendees" : "Stakers"}</span>
                                        </div>
                                        <div className="anct-date">
                                            <span className="txt-white">Date</span>
                                        </div>
                                    </div>}

                                    {isMobile && <div className="anct-div t-mobile">
                                        <div className="anct-start">
                                            <span className="txt-white">Logo</span>
                                        </div>
                                        <div className="anct-center">
                                            <span className="anct-name t-bold txt-white">{route}</span>
                                        </div>
                                        <div className="anct-end">
                                            <span className="txt-white">Price (in NOVA)</span>
                                        </div>
                                    </div>}
                                </li>

                                {curData.data.map((val, idx) => (
                                    <li className="anct-li w-full" key={`anct-li-${idx}`}>
                                        <Link to={getNextRoute(val)} className="anct-a w-full">
                                            {!isMobile && <div className="anct-div t-desktop">
                                                <div className="anct-item">
                                                    <div className="anct-index txt-white">{idx + 1}</div>
                                                    {
                                                        (route === "Galleries" || !val.src) ?
                                                        <LazyLoadImage 
                                                            src={val.img} alt={val.name}
                                                            width={"100%"} height={"100%"}
                                                            scrollPosition={scrollPosition}
                                                            placeholder={<div className={`op-img-placeholder`}></div>}
                                                        />
                                                        :
                                                        <NftImageFile data={val} />
                                                    }
                                                    <span className="txt-white">{val.name}</span>
                                                </div>
                                                <div className="anct-price">
                                                    <span className="txt-white">{val.price}</span>
                                                </div>
                                                {/* <div className="anct-change">
                                                    <div className={`anct-stats ${val.ch > 0 ?"t-green":"txt-white"}`}>
                                                        {
                                                            route === "Galleries" ?
                                                            <MdOutlinePerson className='anct-icon' />
                                                            :
                                                            <SlGraph className='anct-icon' />
                                                        }
                                                        <span>{`${val.change}${route==="Galleries"?"":"%"}`}</span>
                                                    </div>
                                                </div> */}
                                                <div className="anct-count">
                                                    <span className="txt-white">{val.len}</span>
                                                </div>
                                                <div className="anct-date">
                                                    <span className="txt-white">{val.date}</span>
                                                </div>
                                            </div>}

                                            {isMobile && <div className="anct-div t-mobile">
                                                <div className="anct-index">{idx + 1}</div>
                                                <div className="anct-start">
                                                    {
                                                        (route === "Galleries" || !val.src) ?
                                                        <LazyLoadImage 
                                                            src={parseIpfsUrl(val.img)} alt={val.name}
                                                            width={"100%"} height={"100%"}
                                                            scrollPosition={scrollPosition}
                                                            placeholder={<div className={`op-img-placeholder`}></div>}
                                                        />
                                                        :
                                                        <NftImageFile data={val} />
                                                    }
                                                </div>
                                                <div className="anct-center">
                                                    <span className="anct-name t-bold txt-white">{val.name}</span>
                                                    <div className="anct-cnt txt-white">
                                                        <span>{route === "Galleries" ? "Attendees: " : "Stakers: "}</span>
                                                        <span>{val.len}</span>
                                                    </div>
                                                </div>
                                                <div className="anct-end">
                                                    <span className="anct-price t-bold txt-white">{val.price}</span>
                                                    {/* <div className={`anct-stats ${val.ch > 0 ?"t-green":"txt-white"}`}>
                                                        {
                                                            route === "Galleries" ?
                                                            <MdOutlinePerson className='anct-icon' />
                                                            :
                                                            <SlGraph className='anct-icon' />
                                                        }
                                                        <span>{`${val.change}${route==="Galleries"?"":"%"}`}</span>
                                                    </div> */}
                                                </div>
                                            </div>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        )
                    }
                </>
            }
            </div>
        </div>
    );
};

export default AnalyticsHome;