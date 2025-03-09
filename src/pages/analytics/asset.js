import { GrLinkNext } from "react-icons/gr";
import "../asset/asset.css";
import "./styles.css";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner, Skeleton } from "../../components/loading";
import { SlGraph } from "react-icons/sl";
import ChartComponent from "../../components/charts";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBarData, getNftDoughnutData, getLineData } from "./util";
import { BsClock } from "react-icons/bs";
import { AppContext } from "../../context";
import { FaList } from "react-icons/fa";
import ErrorPage from "../../components/error";
import NoData from "../../components/noData";
import { IoIosCopy } from "react-icons/io";
import { formatAssetAnalyticsAddress, getDistributionAboveAndBelowSetPrice, getNfStaketLineData, getNftStakeDistribution, priceDiff } from "../../services/galleryAnalytics";
// import useScrollThrottler from "../../hooks/scrollThrottler";
import { createGalleryContractInstance, createNftLibraryContractInstance, createNftSubmitContractInstance, createStakeContractInstance, createUserContractInstance, divideBigDecimals, getPriceInEth, multiplyBigDecimals, parseBigInt, subtractBigDecimals } from "../../services/creators";
import { AVATAR_PIC, getFullDateWithTime, parseGalleryData, parseNftMetaData, parseStringData, setMessageFn, shortenAddy } from "../../utils";
import { AssetFile } from "../asset/assetFile";

const AssetAnalytics = () => {

    const { nightMode, contract, wallet, setMessage } = useContext(AppContext);
    const { nft_id, gallery_id } = useParams();
    const navigate = useNavigate();
    const [nftError, setNftError] = useState(false);
    const [nftLoading, setNftLoading] = useState(true);
    const [nft, setNft] = useState({});

    const [stakersLoading, setStakersLoading] = useState(true);
    const [stakersError, setStakersError] = useState(false);
    const [stakers, setStakers] = useState([]);

    const [loaded, setLoaded] = useState(false);
    const [piePos, setPiePos] = useState("right");
    const nftPrice = useRef();
    const scrollRef = useRef();

    const [bar, setBar] = useState({ dataset: [], labels: [], loaded: false });
    const [doughnut, setDoughnut] = useState({ dataset: [], labels: [], loaded: false });
    const [line, setLine] = useState({ dataset: [], labels: [], loaded: false });

    // const address = "0xa...965";
    const width = window.innerWidth;
    const skeleton = Array(5).fill(0);

    const g_id = useMemo(() => {
        if(gallery_id) return parseBigInt(String(gallery_id));
        else return "";
    }, [gallery_id]);

    const n_id = useMemo(() => {
        if(nft_id) return parseBigInt(String(nft_id));
        else return "";
    }, [nft_id]);

    const fetchDoughnutData = async (data_ = []) => {
        // setDoughnut({ dataset: d_dataset, labels: d_labels, loaded: true });
        
        // we already have gallery data already by now n so we have the price
        const d_labels = ["Above set price", "At set price", "Below set price"]; 
        const len = getDistributionAboveAndBelowSetPrice(data_, nftPrice.current);
        setDoughnut({ 
            dataset: getNftDoughnutData(len, nightMode), labels: d_labels, 
            loaded: true, changed: new Date().getTime() / 1000 
        });
    };

    const fetchBardata = (data_) => {
        // setBar({ dataset: getBarData(b_dataset.map(l => l * 20 + 5)), labels: b_labels, loaded: true });

        const { labels, data } = getNftStakeDistribution(data_, wallet.decimals);
        // console.log(labels, data)
        setBar({ dataset: getBarData(data), labels, loaded: true, changed: new Date().getTime() / 1000 });
    };

    const fetchLineData = (data_) => {
        // setLine({ dataset: getLineData(line_dataset.map(l => l * 20.098 + 5)), labels: line_labels, loaded: true });

        const { data, labels } = getNfStaketLineData(data_); // get total sold tickets (attendee entered) based on amount for each days
        if(labels.length > 0) {
            labels.unshift("Start");
            data.unshift(0);
        }
        setLine({ dataset: getLineData(data), labels, loaded: true, changed: new Date().getTime() / 1000 });
    };
    
    const fetchNftData = async () => {
        try {
            setNftLoading(true);
            setNftError(false);
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const g_data = parseGalleryData(await contractInstance.getGallery(g_id));
            nftPrice.current = g_data.minStakingAmount;

            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nft_metadata_id = await nftLibraryContractInstance.getNft(g_id, n_id, false);
            const nft_meta_data_id = String(nft_metadata_id[2]);
            
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id[2]); // nft_metadata_id[2]);
            const res = { 
                ...parseNftMetaData(nft_data), gallery_id: String(g_id), price: g_data.minStakingAmount,
                nft_library_id: String(n_id), nft_id: String(nft_meta_data_id), gallery: g_data
            };
            setNft(res);
            setNftLoading(false);
        } catch (err) {
            setNftError(true);
            setNftLoading(false);
            throw new Error("nft");
        }
    };

    const priceDifference = useCallback((price) => {
        if(!nft.price) return price;
        else {
            const diff = subtractBigDecimals(price, nft.price);
            return `${multiplyBigDecimals(divideBigDecimals(diff, nft.price), 100)}${diff > 0 ? "% above" : "% floor"}`;
        }
    }, [nft.price]);

    const getUserImg = async (val) => {
        const userContractInstance = await createUserContractInstance(contract.signer);
        const user = await userContractInstance.getUserInfo(val[2]);
        // priceDiff return { percentDiff and amtDiff };
        return { 
            name: user[0][0], ...parseStringData(user[0][2]), date: String(val[1]),
            address: val[2], amount: String(val[0]), ...priceDiff(val[0], nftPrice.current || 0), 
        };
    };

    const getCast = async (contractInstance, _id) => {
        const [value, time, addy] = await contractInstance.getCast(g_id, n_id, _id);
        return [divideBigDecimals(value, wallet.decimals), time, addy];
    };

    const fetchAnalyticsData = async () => {
        try {
            setStakersLoading(true);
            setStakersError(false);
            const contractInstance = await createStakeContractInstance(contract.signer);
            const lst = await contractInstance.getTotalVotes(g_id, n_id);
            const arr = [];
            for(let i = 1; i <= lst; i++) {
                arr.push(parseBigInt(i));
            };
            const stakes = await Promise.all(arr.map((idx) => getCast(contractInstance, idx).then(res => res)));
            // we already have minStakeingAmt because we fetchedGalleryData complete already
            fetchDoughnutData(stakes);
            fetchBardata(stakes);
            fetchLineData(stakes);
            const stakes_with_user = await Promise.all(stakes.map((val) => getUserImg(val).then(res => res)));
            setStakers(stakes_with_user);
            if(!loaded) setLoaded(true);
            setStakersLoading(false);
        } catch (err) {
            console.log(err);
            setStakersError(true);
            setStakersLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };
    
    const fetchData = () => {
        if(!nft.metadata) fetchNftData();
    };

    const fetchOtherData = () => {
        if(!loaded) fetchAnalyticsData();
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchOtherData();
    }, [nft.gallery]);

    useEffect(() => {
        if(doughnut.loaded) {
            setDoughnut({ dataset: getNftDoughnutData(doughnut.dataset[0].data, nightMode), labels: doughnut.labels, loaded: true });
        }
    }, [nightMode, doughnut.loaded]);
    
    const getFullDateWithTime_ = useCallback((galla) => {
        if(nftLoading || nftError) return "";

        if(galla) return getFullDateWithTime(nft?.gallery?.votingEnd||"");
        else return getFullDateWithTime(nft.metadata.createdAt || (new Date("19 Feb 2025").getTime()));

    }, [nftLoading, nftError, nft?.gallery?.votingEnd, nft?.metadata]);

    const getAddress = useCallback((addy) => {
        let mul = 0.02;
        if(width <= 600 && width >= 550) mul = 0.02;
        const v = Math.floor((width * mul) / 2);
        return addy.slice(0, v + 3) + '...' + addy.slice(-v);
    }, [width]);

    useEffect(() => {
        if(width < 1300) setPiePos("top");
        else setPiePos("right");
    }, [width]);
    
    const shortenAddy_ = useMemo(() => {
        if(!nft.creator) return "";
        return shortenAddy(nft.creator);
    }, [nft.creator]);

    return (
        <div className="Analytics w-full">

            {nftError && <div className='nft-container w-full'>
                <div className="nftc-error">
                    <ErrorPage fireFn={fetchData} />
                </div>
            </div>}

            {!nftError && <div className='nft-container w-full'>
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
                                    state: { galleryData: nft.gallery }
                                }}>{nft.gallery.name}</Link>
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
                                <button className='asset-copy-btn pointer'>
                                    <IoIosCopy className='asset-copy-btn-icon' />
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
                    </div>}

                    {!nftLoading && <div className='nft-content right-c'>
                        <div className='asset-names'>
                            <div className='asset-name'>
                                <div>
                                    <Link to={{
                                        pathname: `/app/gallery/${gallery_id}`,
                                        state: { galleryData: nft.gallery }
                                    }}>{nft.gallery.name}</Link>
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
                                    <span className="txt-white">{`Created ${getFullDateWithTime_(0)}`}</span>
                                </div>
                                <div className='asset-price-div'>
                                    <span className="txt-white">Min. Staking amount</span>
                                    <div className='asset-price txt-white'>
                                        <h2>{`${nft.gallery.minStakingAmount} NOVA`}</h2>
                                        <span>~ {getPriceInEth(nft.gallery.minStakingAmount, wallet.ethPrice)} ETH</span>
                                    </div>
                                    <div className='apd-btns w-full'>
                                        <button className='apd-btn buy-btn pointer'
                                        onClick={() => navigate(`/app/asset/${nft_id}/${gallery_id}`)}>
                                            <GrLinkNext className='apdb-icon' />
                                            <span>Visit page now</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
                </div>
                <div className="nft-analytics-h2 w-full">
                    <h2 className="txt-white">Asset Analytics</h2>
                </div>
                
                {
                    stakersError ?
                    <div className="nft-analytics-error">
                        <div className='nft-content-error'>
                            <ErrorPage fireFn={fetchAnalyticsData} />
                        </div>
                    </div>
                    :
                    ( 
                    (loaded && stakers.length === 0) ?
                    <div className="nft-analytics-no-data">
                        <NoData text={"No Stakers yet for this asset."} />
                    </div>
                    :
                    <>
                        <div className="nft-analytics">
                            <div className="am-plots">
                                <div className="amp- pie-chart">
                                    <span className="txt-white">Price distribution from Set price</span>
                                    <div className="ampc">
                                        {
                                            !doughnut.loaded ?
                                            <LoadingSpinner width={"42px"} height={"42px"} />
                                            :
                                            <ChartComponent datasets={doughnut.dataset} labels={doughnut.labels} 
                                            chartType={"doughnut"} legend={piePos} changed={doughnut.changed} />
                                        }
                                        </div>
                                    </div>
                                    <div className="amp- bar-chart">
                                        {/* to show price distribution of all amount used to stake on this nft */}
                                        <span className="txt-white">Stake Distribution (Stakers vs Amount Range in NOVA)</span>
                                        <div className="ampc">
                                        {
                                            !bar.loaded ?
                                            <LoadingSpinner width={"42px"} height={"42px"} />
                                            :
                                            <ChartComponent datasets={bar.dataset} labels={bar.labels} 
                                            chartType={"bar"} smallSize={true} changed={bar.changed}  />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="nft-analytics m-10 w-full">
                            <div className="am-plots">
                                <div className="amp- line-chart">
                                    <div className="amp-header w-full">
                                        <div className="ampht-top">
                                            <SlGraph className='ampht-icon txt-white' />
                                            <span className='txt-white'>Stakers Plot</span>
                                        </div>
                                    </div>
                                    <div className='amp-chart'>
                                        {
                                            !line.loaded ?
                                            <LoadingSpinner width={"42px"} height={"42px"} />
                                            :
                                            <ChartComponent datasets={line.dataset} labels={line.labels} 
                                            legend={false} changed={line.changed}  
                                            smallSize={true} radius={2.4} formatX={formatAssetAnalyticsAddress} />
                                        }
                                    </div>
                                </div>
                                <div className="amp- line-chart">
                                    <div className="board-history w-full">
                                        <div className="amp-header w-full">
                                            <div className="ampht-top">
                                                <FaList className='ampht-icon txt-white' />
                                                <span className='txt-white'>Stakers Log (price in NOVA)</span>
                                            </div>
                                        </div>
                                        <div className="ampb">
                                            <div className="ampb-overflow w-full h-full" ref={scrollRef}>
                                                {
                                                    stakersLoading ?
                                                    <ul className="ampb-ul">
                                                        {skeleton.map((val, idx) => (
                                                            <li key={`ampbd-${idx}`} className="ampb-li">
                                                                <div className="ampbl-img loading">
                                                                    <Skeleton />
                                                                </div>
                                                                <div className="ampbl-txt1">
                                                                    <span className="ampbl-name txt-white loading"><Skeleton /></span>
                                                                    <span className="ampbl-date txt-white loading"><Skeleton /></span>
                                                                </div>
                                                                <div className="ampbl-txt2">
                                                                    <span className="ampbl-name txt-white price loading"><Skeleton /></span>
                                                                    <span className="ampbl-date txt-white change loading"><Skeleton /></span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    :
                                                    <ul className="ampb-ul">
                                                        {stakers.map((val, idx) => (
                                                            <li key={`ampbd-${idx}`} className="ampb-li">
                                                                <div className="ampbl-img">
                                                                    <LazyLoadImage 
                                                                        src={val.img||AVATAR_PIC} alt={val.name}
                                                                        width={"100%"} height={"100%"}
                                                                        placeholder={<div className={`op-img-placeholder`}></div>}
                                                                    />
                                                                </div>
                                                                <div className="ampbl-txt1">
                                                                    <span className="ampbl-name txt-white">{getAddress(val.address)}</span>
                                                                    <span className="ampbl-date txt-white">{getFullDateWithTime(val.date, 1000)}</span>
                                                                </div>
                                                                <div className="ampbl-txt2">
                                                                    <span className="ampbl-name txt-white price">{val.amount}</span>
                                                                    <span className="ampbl-date txt-white change">{priceDifference(val.amount)}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                    )
                }
            </div>}
        </div>
    );
};

export default AssetAnalytics;