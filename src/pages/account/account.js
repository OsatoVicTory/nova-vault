import { MdEdit } from "react-icons/md";
import '../galla/gallery.css';
import "./account.css";
import { IoIosCopy } from "react-icons/io";
import { BsGrid, BsList, BsDot } from "react-icons/bs";
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { NFTFlexImage, NFTGridImage } from '../../components/renderImage/nftImage';
import { AppContext } from '../../context';
import { AVATAR_PIC, parseGalleryData, parseNftMetaData, parseStringData, shortenAddy } from "../../utils";
import { Skeleton } from "../../components/loading";
import NoData from "../../components/noData";
// import { fakeAccount } from "../../fakeDatas";
import ErrorPage from "../../components/error";
import { 
    createERC1155ContractInstance, createGalleryContractInstance, 
    createNftLibraryContractInstance, createNftMarketContractInstance, 
    createNftSubmitContractInstance, createUserContractInstance, divideBigDecimals, parseBigInt 
} from "../../services/creators";
import { fetchAcceptedNFTs, fetchAccessibleGalleries, fetchCollectedNFTs, fetchOwnedNFTs } from "../../services/nfts";
import { FaCheck } from "react-icons/fa6";


const UserAccount = () => {

    const { scrollPosition, contract, wallet } = useContext(AppContext);
    const { user_address } = useParams();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [error, setError] = useState(false);
    const [route, setRoute] = useState("Galleries");
    const [listType, setListType] = useState("Grid");
    const [copied, setCopied] = useState(false);

    const [accountLoading, setAccountLoading] = useState(true);
    const [account, setAccount] = useState({});
    
    const [dataGalleriesLoading, setDataGalleriesLoading] = useState(true);
    const [dataGalleries, setDataGalleries] = useState({ data: [], loaded: false });

    const [dataCreatedLoading, setDataCreatedLoading] = useState(false);
    const [dataCreated, setDataCreated] = useState({ data: [], loaded: false });

    const [dataCollectedLoading, setDataCollectedLoading] = useState(false);
    const [dataCollected, setDataCollected] = useState({ data: [], loaded: false });
    const [showMore, setShowMore] = useState(false);
    const skeletons = Array(8).fill(0);
    const notExist = "User does not exist";

    const url = window.location.href;

    // const address = "0xa778cE308fcB1d35db8B2E40d86d979387b31965";
    
    const fetchAccountData = async () => {
        try {
            setAccountLoading(true);
            setError(false);
            const contractInstance = await createUserContractInstance(contract.signer);
            const hasRegistered = await contractInstance.hasRegistered(user_address);
            if(!hasRegistered) {
                setError(notExist);
            } else {
                const user = await contractInstance.getUserInfo(user_address);
                const user_res = { name: user[0][0], description: user[0][1], ...parseStringData(user[0][2]), joinedAt: user[1][0] };
                setAccount(user_res);
            }
            setAccountLoading(false);
        } catch (err) {
            setError(true);
            setAccountLoading(false);
        }
    };

    const fetchGallery = async (index, contractInstance) => {
        const id = await contractInstance.getUc(index, contract.address, 0);
        const res_ = await contractInstance.getGallery(id);
        return { gallery_id: String(id), ...parseGalleryData(res_) };
    };
    
    const fetchGalleries = async () => {
        try {
            setDataGalleriesLoading(true);
            setDataGalleries({ ...dataGalleries, error: false });
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const len = await contractInstance.getLenUc(contract.address, 0);
            const res = await Promise.all(
                Array((len + "") - 0).fill(0).map((v, i) => {
                    return fetchGallery(parseBigInt(i), contractInstance).then(res => res);
                })
            );
            setDataGalleries({ data: res, loaded: true, error: false });
            setDataGalleriesLoading(false);
        } catch (err) {
            console.log("gallery", err);
            setDataGalleries({ ...dataGalleries, error: true });
            setDataGalleriesLoading(false);
        }
    };

    const fetchNft = async (val, nftLibraryContractInstance, nftSubmitContractInstance) => {
        const { gallery_id, nft_library_id } = val;
        const [creator, type, nft_metadata_id] = await nftLibraryContractInstance.getNft(gallery_id, nft_library_id, false);
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_metadata_id);
        const res = { 
            ...parseNftMetaData(nft_data), gallery_id: String(gallery_id), 
            nft_library_id: String(nft_library_id), nft_id: String(nft_metadata_id),
            type: String(type) === "0" ? "In Review" : (String(type) === "1" ? "Accepted" : "Rejected")
        };
        return res;
    };
    
    // should only be used in current user's own account page
    const fetchCreated = async () => {
        try {
            setDataCreatedLoading(true);
            setDataCreated({ ...dataCreated, error: false });
            const resp = await fetchAcceptedNFTs(contract.signer, user_address);

            const contractInstance = await createGalleryContractInstance(contract.signer);
            const accessibleGalleries = await fetchAccessibleGalleries(user_address, contractInstance, fetchGallery);
            const res_ = resp.filter(resp_ => accessibleGalleries.includes(resp_.gallery_id)); 

            const nftLibraryContractInstance = await createNftLibraryContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const res = await Promise.all(res_.map((val) => {
                return fetchNft(val, nftLibraryContractInstance, nftSubmitContractInstance).then(res => res)
            }));
            console.log("created-res", res);
            setDataCreated({ data: res, loaded: true, error: false });
            setDataCreatedLoading(false);
        } catch (err) {
            console.log("created", err);
            setDataCreated({ ...dataCreated, error: true });
            setDataCreatedLoading(false);
        }
    };

    const fetchNftCollectedMetaData = async (token_id, contractInstance, nftSubmitContractInstance) => {
        const [gallery_id, nft_library_id, nft_id] = await contractInstance.getData(token_id);
        
        const nft_data = await nftSubmitContractInstance.getNftData(nft_id);
        return {
            ...parseNftMetaData(nft_data), gallery_id: String(gallery_id),
            nft_library_id: String(nft_library_id), nft_id: String(nft_id), token_id: String(token_id)
        };
    };
    
    const fetchCollected = async () => {
        try {
            setDataCollectedLoading(true);
            setDataCollected({ ...dataCollected, error: false });
            const res_ = await fetchCollectedNFTs(contract.signer, user_address);
            const ids = await fetchOwnedNFTs(contract.signer, user_address, res_);
            const contractInstance = await createERC1155ContractInstance(contract.signer);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const res = await Promise.all(
                ids.map((id) => {
                    return fetchNftCollectedMetaData(id, contractInstance, nftSubmitContractInstance).then(res => res)
                })
            );
            console.log("nfts_data", res, "ids", ids, res_);
            const marketContractInstance = await createNftMarketContractInstance(contract.signer);
            const forSale = Array.from(await marketContractInstance.getCostBatch(Array(ids.length).fill(user_address), ids));
            console.log("forSale", forSale);
            const res_Forsale = [];
            for(let i = 0; i < forSale.length; i++) {
                const [price, isForSale, copies] = forSale[i];
                if(isForSale && copies > 0) res_Forsale.push({ 
                    ...res[i], copies: String(copies),
                    price: String(divideBigDecimals(price, wallet.decimals)), 
                });
            }
            setDataCollected({ data: res, forSale: res_Forsale, loaded: true, error: false });
            setDataCollectedLoading(false);
        } catch (err) {
            console.log("collected", err);
            setDataCollected({ ...dataCollected, error: true });
            setDataCollectedLoading(false);
        }
    };
    
    const fetchData = async () => {
        if(!account.name) fetchAccountData();
        if(!dataGalleries.loaded) fetchGalleries();
    };

    const fetchOtherData = async () => {
        if(route === "Galleries" && !dataGalleries.loaded) fetchGalleries();
        if(route === "Created" && !dataCreated.loaded) fetchCreated();
        if((route === "Collected" || route === "For Sales") && !dataCollected.loaded) fetchCollected();
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchOtherData();
    }, [route]);

    const handleChange = useCallback((e) => {
        setSearch(e.target.value);
    }, []);

    const shortenAddy_ = useMemo(() => {
        return user_address ? shortenAddy(user_address) : "";
    }, [user_address]);

    const scrolled = useMemo(() => {
        return scrollPosition.y >= 250;
    }, [scrollPosition.y]);

    useEffect(() => {
        if(route === "Galleries") setListType("Grid");
    }, [route]);

    const curData = useMemo(() => {
        if(route === "Galleries") return { ...dataGalleries, loading: dataGalleriesLoading, route };
        else if(route === "Created") return { ...dataCreated, loading: dataCreatedLoading, route };
        else if(route === "Collected") return { ...dataCollected, forSale: "", loading: dataCollectedLoading, route }
        else return  { ...dataCollected, data: dataCollected.forSale||[], forSale: "", loading: dataCollectedLoading, route }
    }, [
        route, dataGalleriesLoading, dataCollectedLoading, dataCreatedLoading
        // dataGalleries.data.length, dataCreated.data.length, dataCollected.data.length
    ]);

    const displayableData = useMemo(() => {
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

    const shouldAddMore = useMemo(() => {
        if(account.description) {
            const { innerWidth } = window;
            let mul = 0.5;
            if(innerWidth <= 1030) mul = 0.74;
            return (mul * innerWidth) <= (6.4 * account.description.length);
        } else return false;
    }, [account?.description]);

    const getRouteObject = useCallback((val) => {
        if(route === "Galleries") {
            return {
                pathname: `/app/gallery/${val.gallery_id}`,
                state: { galleryData: val }
            }
        } else if(route === "Created") {
            // only this userProfile page can show Created assets
            return {
                pathname:  `/app/asset/${val.nft_library_id}/${val.gallery_id}`,
                state: { nft: { ...val } } 
            }
        } else if(route === "Collected") {
            // only this userProfile page can show Created assets
            return {
                pathname:  `/app/asset-collected/${val.nft_library_id}/${val.gallery_id}/${val.token_id}/${user_address}`,
                state: { nft: { ...val } } 
            }
        } else {
            // Collected or For Sale should route to sell page of asset
            return {
                pathname:  `/app/asset-forsale/${val.nft_library_id}/${val.gallery_id}/${val.token_id}/${user_address}`,
                state: { nft: { ...val } } 
            }
        }
    }, [route]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch(err) {
            console.log(err);
        }
    };

    return (
        <div className="Account w-full">
        {
            error ?
            <div className="account-wrapper w-full">
                <ErrorPage text={error === notExist ? error : null} 
                fireFn={error !== notExist ? fetchData : navigate(`/app`)} />
            </div>
            :
            <div className="account-wrapper w-full">
                {accountLoading && <div className="account-header">
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

                {!accountLoading && <div className="account-header">
                    <div className="ah-section sect-1 w-full">
                        {account?.image_banner ?
                            <div className="acct-banner"></div> 
                            :
                            <div className="acct-banner" style={{backgroundImage: `url(${account.image_banner})`}}></div>
                        }
                        <div className="acct-pfp">
                            <img src={account.img||AVATAR_PIC} alt="pfp" />
                        </div>
                        <div className="acct-name loaded">
                            <span className="txt-white">{account.name}</span>
                            <div className="acct-name-side">
                                <div className="pointer">
                                    <div className="anc-url txt-white">{url}</div>
                                    <button className="anc pointer" onClick={handleCopy}>
                                        {
                                            copied ?
                                            <FaCheck className='anc-icon txt-white' />
                                            :
                                            <IoIosCopy className='anc-icon txt-white' />
                                        }
                                    </button>
                                </div>
                                {/* <button className="anc-btn pointer" onClick={() => setEditUser(true)}>
                                    <span className="txt-white">Edit profile</span>
                                    <MdEdit className="txt-white ancb-icon" />
                                </button> */}
                            </div>
                        </div>
                        <div className="acct-desc w-full">
                            <div className="acd txt-white w-full">
                                <span>{`Address ${shortenAddy_}`}</span><BsDot className='and-icon' />
                                <span className="acd-join">{`Joined Mar 2024`}</span>
                            </div>
                            <div className="and w-full">
                                <div>
                                    <span className={`and-span txt-white ${showMore}`}>
                                        {account.description}
                                    </span>
                                    {shouldAddMore && <span className={`and-more ${!showMore} txt-white pointer`} 
                                    onClick={() => setShowMore(true)}>See more</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>}
                <div className="ah-sticky w-full">
                    {!accountLoading && <div className={`ah-display-on-scroll ${scrolled} w-full`}>
                        <div className="ados">
                            <div>
                                <img src={account.img} alt="pfp" />
                                <span className="profile-name txt-white">{account.name}</span>
                            </div>
                            <div>
                                <button className="profile-btn">
                                    <MdEdit className="txt-white pb-icon" />
                                </button>
                                <button className="profile-btn">
                                    <IoIosCopy className="txt-white pb-icon" />
                                </button>
                            </div>
                        </div>
                    </div>}

                    <div className="ah-routes">
                        <button className={`ahr-btn ${route === "Galleries"} txt-white pointer`}
                        onClick={() => setRoute("Galleries")}>{`Galleries`}</button>
                        <button className={`ahr-btn ${route === "Created"} txt-white pointer`}
                        onClick={() => setRoute("Created")}>{`Created`}</button>
                        <button className={`ahr-btn ${route === "Collected"} txt-white pointer`}
                        onClick={() => setRoute("Collected")}>{`Collected`}</button>
                        <button className={`ahr-btn ${route === "For Sales"} txt-white pointer`}
                        onClick={() => setRoute("For Sales")}>{`For Sales`}</button>
                    </div>

                    <div className='glm-head w-full'>
                        <div className='glmh1'>
                            <h3 className="txt-white">Profile</h3>
                            {
                                curData.loading ? 
                                <div className='glm-search loading'>
                                    <div className='glm-search-loading'><Skeleton /></div>
                                </div>
                                :
                                <div className='glm-search'>
                                    <AiOutlineSearch className={`glms-icon ${search?true:false} txt-white`} />

                                    <input className={`glms-input ${search?true:false} txt-white`} 
                                    value={search||""} placeholder='Search for an NFT...' onChange={handleChange} />

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
                                <button className={`sb-btn ${route !== "Galleries" && "pointer"} ${listType === "Flex"}`} 
                                onClick={() => route !== "Galleries" && setListType("Flex")}>
                                    <BsList className='sbb-icon txt-white' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {curData.error && <div className="account-main w-full">
                    <div className="account-main-error w-full">
                        <ErrorPage fireFn={fetchOtherData} />
                    </div>
                </div>}
                
                {!curData.error && <div className="account-main w-full">
                    
                    {(!curData.loading && curData.data.length === 0) && 
                        <div className='glm-body w-full'>
                            <div className="w-full" style={{marginTop: '20px'}}>
                                <NoData text={`No data in ${route}`} />
                            </div>
                        </div>
                    }
                    
                    {(curData.loading || curData.data.length > 0) &&
                        <div className='glm-body w-full'>
                        {
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
                                                <span className="nft-f-txt nftf-amount txt-white">Floor price</span>
                                                <span className="nft-f-txt txt-white">Owner</span>
                                                <span className="nft-f-txt txt-white">Date</span>
                                            </div>
                                        </div>
                                    </li>
                                }

                                {
                                    curData.loading ? 
                                    skeletons.map((val, idx) => (
                                        <li key={`glm-li-${idx}`} className='Art-li w-full'>
                                            <div className='Art-div art-loading pointer w-full'>
                                                <div className='NFT-Art w-full'>
                                                    {   
                                                        listType === "Grid" 
                                                        ?
                                                        <NFTGridImage nft={val} loading={true}
                                                        scrollPosition={scrollPosition} isGallery={route === "Galleries"} /> 
                                                        :
                                                        <NFTFlexImage nft={val} loading={true}
                                                        clx={"nft-flex"} index={idx} scrollPosition={scrollPosition} /> 
                                                    }
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                    :
                                    displayableData.map((val, idx) => (
                                        <li key={`glm-li-${idx}`} className='Art-li w-full'>
                                            <Link to={{...getRouteObject(val)}} 
                                            className='Art-div pointer w-full'>
                                                <div className='NFT-Art w-full'>
                                                    {   
                                                        listType === "Grid" 
                                                        ?
                                                        <NFTGridImage nft={val} loading={false} hasPrice={route === "For Sales"}
                                                        scrollPosition={scrollPosition} isGallery={route === "Galleries"} /> 
                                                        :
                                                        <NFTFlexImage nft={val} loading={false} 
                                                        hasPrice={route === "For Sales"} isGallery={false}
                                                        clx={"nft-flex"} index={idx} scrollPosition={scrollPosition} /> 
                                                    }
                                                </div>
                                            </Link>
                                        </li>
                                    ))
                                }
                            </ul>
                        }
                        </div>
                    }
                </div>}
            </div>
        }
        </div>
    );
};

export default UserAccount;