import "../account/account.css";
import "./styles.css";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { IoIosCopy } from "react-icons/io";
import { BsDot } from "react-icons/bs";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GrLinkNext } from "react-icons/gr";
import { SlGraph } from "react-icons/sl";
import { RiNftFill } from "react-icons/ri";
import { MdKeyboardArrowDown, MdOutlinePriceChange } from "react-icons/md";
import { FaPeopleGroup } from "react-icons/fa6";
import ChartComponent from "../../components/charts";
import { getLineData, getBarData, getDoughnutData } from "./util";
import { LoadingSpinner, Skeleton } from "../../components/loading";
import { FaList } from "react-icons/fa";
// import { fakeAttendees, fakeGallery } from "../../fakeDatas";
import { useNavigate, useParams } from "react-router-dom";
import ErrorPage from "../../components/error";
import NoData from "../../components/noData";
import { getGalleryAttendees, getGalleryAttendeesDistribution, getGalleryAttendeesPrices, getGalleryLineData, getNftsAnalyticsData } from "../../services/galleryAnalytics";
// import useScrollThrottler from "../../hooks/scrollThrottler";
import { createGalleryContractInstance, createUserContractInstance, divideBigDecimals, parseBigInt } from "../../services/creators";
import { AppContext } from "../../context";
import { AVATAR_PIC, getDateWithoutTime, getFullDateWithTime, parseGalleryData, parseIpfsUrl, parseStringData, setMessageFn } from "../../utils";


const GalleryAnalytics = () => {

    const [showMore, setShowMore] = useState(false);
    const { contract, setMessage } = useContext(AppContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const { gallery_id } = useParams();
    const navigate = useNavigate();
    const notExist = "Gallery does not exist";

    const [galleryError, setGalleryError] = useState(false);
    const [galleryLoading, setGalleryLoading] = useState(true);
    const [gallery, setGallery] = useState({});
    const [piePos, setPiePos] = useState("right");

    const [attendeesLoading, setAttendeesLoading] = useState(true);
    const [attendeesError, setAttendeesError] = useState(false);
    const [attendees, setAttendees] = useState({ prices: [], attendees: [], loaded: false });

    const [nftsAnalyticsLoading, setNftsAnalyticsLoading] = useState(true);
    const [nftsAnalyticsError, setNftsAnalyticsError] = useState(false);
    const [nftsAnalytics, setNftsAnalytics] = useState({ data: [], loaded: false });

    const [range, setRange] = useState(30);
    const dropdowns = [30, 60, 90, "Full"];
    // const scrollRef = useRef();
    const stopFetching = useRef();

    const [bar, setBar] = useState({ dataset: [], labels: [], loaded: false });
    const [doughnut, setDoughnut] = useState({ dataset: [], labels: [], loaded: false });
    const [line, setLine] = useState({ dataset: [], labels: [], loaded: false });

    const skeleton = Array(5).fill(0);

   //'https://i.seadn.io/s/raw/files/6ce548765e39dcea937f03046a111e79.png';

   const url = window.location.href;
    // const address = "0xa778cE308fcB1d35db8B2E40d86d979387b31965";
    const width = window.innerWidth;
    
    const fetchDoughnutData = (len = []) => {
        const d_labels = ["Accepted", "Rejected"]; // #25d366
        setDoughnut({ dataset: getDoughnutData(len), labels: d_labels, loaded: true, changed: new Date().getTime() / 1000 });
    };
    
    const fetchBardata = (data_ = []) => {
        // setBar({ dataset: getBarData(line_dataset.map(l => l * 10 + 5)), labels: line_labels, loaded: true });

        const { labels, data } = getGalleryAttendeesDistribution(data_);
        setBar({ dataset: getBarData(data), labels, loaded: true, changed: new Date().getTime() / 1000 });
    };

    const fetchLineData = (data_ = []) => {
        // setLine({ dataset: getLineData(line_dataset), labels: line_labels, loaded: true });

        const { data, labels } = getGalleryLineData(data_); // get total sold tickets (attendee entered) based on amount for each days
        if(labels.length > 0) {
            labels.unshift("Start");
            data.unshift(0);
        }
        setLine({ dataset: getLineData(data), labels, loaded: true, changed: new Date().getTime() / 1000 });
    };
    
    const fetchGalleryData = async () => {
        try {
            setGalleryLoading(true);
            setGalleryError(false);
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const data = await contractInstance.getGallery(parseBigInt(gallery_id));
            if(!data) return setGalleryError(notExist);
            setGallery({ ...parseGalleryData(data), gallery_id });
            setGalleryLoading(false);
        } catch (err) {
            setGalleryLoading(false);
            setGalleryError(true);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    const fetchNftsAnalyticsData = async () => {
        try {
            setNftsAnalyticsLoading(true);
            setNftsAnalyticsError(false);
            const { len } = await getNftsAnalyticsData(contract.signer, gallery_id);
            fetchDoughnutData(len);
            setNftsAnalytics({ loaded: true, data: len })
            setNftsAnalyticsLoading(false);
        } catch (err) {
            console.log(err);
            setNftsAnalyticsError(true);
            setNftsAnalyticsLoading(false);
        }
    };

    const getUserImg = async (v) => {
        const userContractInstance = await createUserContractInstance(contract.signer);
        const user = await userContractInstance.getUserInfo(v.address);
        return { ...v, name: user[0][0], description: user[0][1], ...parseStringData(user[0][2]) };
    }

    const fetchAttendeesData = async () => {
        try {
            // if(attendees.loaded && stopFetching.current) return setAttendeesLoading(false);

            if(!attendees.loaded) setAttendeesLoading(true);
            setAttendeesError(false);
            const res_ = await getGalleryAttendeesPrices(contract.signer, contract.address, gallery_id, range);
            const res = res_.map(v => ({ ...v, price: divideBigDecimals(v.price, 1E10) }));
            if(res.length === attendees.prices.length && attendees.loaded) {
                setAttendeesLoading(false);
                return stopFetching.current = true;
            }

            fetchLineData(res);
            fetchBardata(res);

            if(!attendees.loaded) {
                const resp = await getGalleryAttendees(contract.signer, gallery_id);
                const data_ = await Promise.all(resp.map((val) => getUserImg(val).then(res => res))) // for user's pic
                setAttendees({ prices: res, attendees: data_, loaded: true });
            } else {
                setAttendees({ ...attendees, prices: res, loaded: true });
            }
            setAttendeesLoading(false);
        } catch (err) {
            console.log(err);
            setAttendeesError(true);
            setAttendeesLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };
    
    const fetchData = () => {
        if(!gallery.name) fetchGalleryData();
        if(!nftsAnalytics.loaded) fetchNftsAnalyticsData();
        if(!attendees.loaded) fetchAttendeesData();
    };

    useEffect(() => {
        fetchData();
    }, []);

    // uncomment
    useEffect(() => {
        // only after it has loaded
        if(range && attendees.loaded) fetchAttendeesData();
    }, [range, attendees.loaded]);

    // const fn = (e) => {
    //     if(stopFetching.current) return;
    //     const { scrollTop, scrollHeight, offsetHeight } = e.target;
    //     if(scrollTop >= scrollHeight - offsetHeight - 1) setRange(range + 30);
    // };

    // useScrollThrottler(scrollRef, fn, [attendeesLoading, attendees.length], 500);
    
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

    const shouldAddMore = useMemo(() => {
        if(gallery?.metadata) {
            const { innerWidth } = window;
            let mul = 0.5;
            if(innerWidth <= 1030) mul = 0.74;
            return (mul * innerWidth) <= (6.4 * (gallery.metadata.description||"").length);
        } else return false;
    }, [gallery?.metadata]);
    
    const getDateWithoutTime_ = useMemo(() => {
        if(gallery.createdAt) return getDateWithoutTime(gallery.createdAt, 1000);
        else return "";
    }, [gallery.createdAt]);

    const noNftsData = useMemo(() => {
        if(nftsAnalytics.loaded) return (nftsAnalytics.data[0] + nftsAnalytics.data[1]) === 0;
        else return false;
    }, [nftsAnalytics.loaded]);

    return (
        <div className="Analytics w-full">

            {galleryError && <div className='nft-container w-full'>
                <div className="nftc-error">
                    <ErrorPage text={galleryError === notExist ? notExist : null}
                    fireFn={galleryError === true ? fetchData : () => navigate(`/app/analytics`)}  />
                </div>
            </div>}

            {!galleryError && <div className="analytics-wrapper account-wrapper w-full">
                {galleryLoading && <div className="account-header">
                    <div className="ah-section sect-1 w-full">
                        <div className="acct-banner"></div>
                        <div className="acct-pfp">
                            <div className="acct-pfp-loading"><Skeleton /></div>
                        </div>
                        <div className="acct-name">
                            <span className="loading txt-white"><Skeleton /></span>
                            <div className="acct-name-side">
                                <div className="a-loading">
                                    <Skeleton />
                                </div>
                                <div className="anc-btn-loading a-loading">
                                    <Skeleton />
                                </div>
                            </div>
                        </div>
                        <div className="acct-desc w-full">
                            <div className="acd loading txt-white w-full">
                                <Skeleton />
                            </div>
                            <div className="and w-full">
                                <div className="and-loading">
                                    <Skeleton />
                                    <Skeleton />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>}
                
                {!galleryLoading && <div className="account-header">
                    <div className="ah-section sect-1 w-full">
                        <div className="acct-banner" style={{backgroundImage: `url(${parseIpfsUrl(gallery.metadata.banner_img)})`}}></div>
                        <div className="acct-pfp">
                            <img src={parseIpfsUrl(gallery.metadata.img)} alt="pfp" />
                        </div>
                        <div className="acct-name loaded">
                            <span className="txt-white">{gallery.name}</span>
                            <div className="acct-name-side">
                                <div className="pointer">
                                    <div className="anc-url txt-white">{url}</div>
                                    <button className="anc pointer">
                                        <IoIosCopy className='anc-icon txt-white' />
                                    </button>
                                </div>
                                <button className="anc-btn pointer">
                                    <span className="txt-white">Visit page</span>
                                    <GrLinkNext className="txt-white ancb-icon" />
                                </button>
                            </div>
                        </div>
                        <div className="acct-desc w-full">
                            <div className="acd txt-white w-full">
                                <span>{`Gallery Index:  ${gallery_id}`}</span><BsDot className='and-icon' />
                                <span className="acd-join">{`Created ${getDateWithoutTime_}`}</span>
                            </div>

                            {gallery?.metadata?.description && <div className="and w-full">
                                <div>
                                    <span className={`and-span txt-white ${showMore}`}>
                                        {gallery.metadata.description}
                                    </span>
                                    {shouldAddMore && <span className={`and-more ${!showMore} txt-white pointer`} onClick={() => setShowMore(true)}>See more</span>}
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>}
                
                {
                    // good to use nftsAnalyticsError here cus it will help us get data for the
                    // boxed divs i.e Total nfts, floor price of nft, etc
                    // and total attendees can be gotten from the gallery data
                    nftsAnalyticsError ?
                    <div className="nft-analytics-error">
                        <ErrorPage fireFn={fetchData} />
                    </div>
                    :
                    ( 
                    <div className="analytics_main w-full">
                        <section className="a_m_1">
                            <div>
                                <div className="am1">
                                    <div className="am1-div">
                                        <RiNftFill className="amd-icon txt-white" />
                                        <div>
                                            <span className="txt-white">Created Assets</span>
                                            {nftsAnalyticsLoading ?
                                                // zero if no data
                                                <div className="amd-h2-loading"><Skeleton /></div> :
                                                <h2 className="txt-white">{nftsAnalytics.data[0]}</h2>
                                            }
                                        </div>
                                    </div>
                                    <div className="am1-div">
                                        <FaPeopleGroup className="amd-icon txt-white" />
                                        <div>
                                            <span className="txt-white">Total Attendees</span>
                                            {galleryLoading ?
                                                // zero if no data
                                                <div className="amd-h2-loading"><Skeleton /></div> :
                                                <h2 className="txt-white">{gallery.attendees}</h2>
                                            }
                                        </div>
                                    </div>
                                    <div className="am1-div">
                                        <MdOutlinePriceChange className="amd-icon txt-white" />
                                        <div>
                                            <span className="txt-white">Price ($NOVA)</span>
                                            {galleryLoading ?
                                                // zero if no data
                                                <div className="amd-h2-loading"><Skeleton /></div> :
                                                <h2 className="txt-white">{gallery.price}</h2>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="a_m_plots w-full">
                            <div className="am-plots">
                                <div className="amp- pie-chart">
                                    <span className="txt-white">Accepted and Rejected Assets</span>
                                    <div className="ampc">
                                    {
                                        nftsAnalyticsError ?
                                        <ErrorPage fireFn={fetchNftsAnalyticsData} text={"Error fetching data. Retry."} />
                                        :
                                        (
                                            (nftsAnalyticsLoading || !doughnut.loaded) ?
                                            <LoadingSpinner width={"42px"} height={"42px"} />
                                            :
                                            (
                                                noNftsData ?
                                                <h2 className="txt-white">{`No nft has been accepted or rejected yet`}</h2>
                                                :
                                                <ChartComponent datasets={doughnut.dataset} labels={doughnut.labels} 
                                                chartType={"doughnut"} legend={piePos} changed={doughnut.changed} />
                                            )
                                        )
                                    }
                                    </div>
                                </div>
                                <div className="amp- bar-chart">
                                    {/* to show price distribution of all nfts in this collection/nft */}
                                    <span className="txt-white">Joining Rate</span>
                                    <div className="ampc">
                                    {
                                        attendeesError ?
                                        <ErrorPage fireFn={fetchAttendeesData} text={"Error fetching data. Retry."} />
                                        :
                                        (
                                            ((attendeesLoading && !attendees.loaded) || !bar.loaded) ?
                                            <LoadingSpinner width={"42px"} height={"42px"} />
                                            :
                                            (
                                                attendees.attendees.length === 0 ?
                                                <h2 className="txt-white">{`No one has entered this gallery yet`}</h2>
                                                :
                                                <ChartComponent datasets={bar.dataset} labels={bar.labels} 
                                                chartType={"bar"} changed={bar.changed} />
                                            )
                                        )
                                    }
                                    </div>
                                </div>
                            </div>
                        </section>
                        <div className="account-analytics m-10 w-full">
                            <div className="am-plots">
                                <div className="amp- line-chart">
                                    <div className="amp-header w-full">
                                        <div className="ampht-top">
                                            <SlGraph className='ampht-icon txt-white' />
                                            <span className='txt-white'>Ticket Sales Plot</span>
                                        </div>
                                        <div className="a-cncf-gallery">
                                            <div className="a-cncfg-selected">
                                                <span className="txt-white">{range} Days</span>
                                                <MdKeyboardArrowDown onClick={() => setShowDropdown(!showDropdown)}
                                                className={`a-cncfg-icon txt-white ${showDropdown}`} />
                                            </div>
                                            <div className={`a-cncfg-dropdown ${showDropdown}`}>
                                                <div className="a-cncfgd w-full">
                                                    {dropdowns.map((val, idx) => (
                                                        <div className="a-cncfgd-li" key={`cnf-${idx}`}
                                                        onClick={() => setRange(val)}>
                                                            <span className="txt-white">{val} Days</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='amp-chart'>
                                        {
                                            (attendeesError && !attendees.loaded) ?
                                            <div className="nft-analytics-error">
                                                <ErrorPage fireFn={fetchAttendeesData} 
                                                text={`Error fetching attendees data`} />
                                            </div>
                                            :
                                            (
                                                ((attendeesLoading && !attendees.loaded) || !line.loaded) ?
                                                <LoadingSpinner width={"42px"} height={"42px"} />
                                                :
                                                (
                                                    attendees.prices.length === 0 ?
                                                    <h2 className="txt-white">{`No ticket sales for this gallery yet`}</h2>
                                                    :
                                                    <ChartComponent datasets={line.dataset} labels={line.labels} 
                                                    legend={false} radius={2.4} xLabels={10} changed={line.changed} />
                                                )
                                            )
                                        }
                                    </div>
                                </div>
                                <div className="amp- line-chart">
                                    <div className="board-history w-full">
                                        <div className="amp-header w-full">
                                            <div className="ampht-top">
                                                <FaList className='ampht-icon txt-white' />
                                                <span className='txt-white'>Participants Log</span>
                                            </div>
                                        </div>
                                        <div className="ampb">
                                            <div className="ampb-overflow w-full h-full">
                                                {
                                                    (attendeesError && !attendees.loaded) 
                                                    ?
                                                    <div className="nft-analytics-error">
                                                        <ErrorPage fireFn={fetchAttendeesData} 
                                                        text={`Error fetching attendees data`} />
                                                    </div>
                                                    :
                                                    (
                                                        (attendeesLoading && !attendees.loaded) 
                                                        ?
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
                                                        (
                                                            attendees.attendees.length === 0 
                                                            ?
                                                            <div className="attendees-no-data">
                                                                <NoData text={`No one has enetered this gallery yet`} />
                                                            </div> 
                                                            :
                                                            <ul className="ampb-ul">
                                                                {attendees.attendees.map((val, idx) => (
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
                                                                            <span className="ampbl-date txt-white">{getFullDateWithTime(val.date)}</span>
                                                                        </div>
                                                                        <div className="ampbl-txt2">
                                                                            <span className="ampbl-name txt-white price">{gallery.price}</span>
                                                                            <span className="ampbl-date txt-white change">{"NOVA"}</span>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )
                                                    )
                                                }
                                                
                                                {/* {(attendeesLoading && attendeesLoaded) && 
                                                        <div className="bottom-loading w-full">
                                                            <LoadingSpinner width={"18px"} height={"18px"} />
                                                        </div>
                                                } */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )
                }
            </div>}
        </div>
    );
};

export default GalleryAnalytics;