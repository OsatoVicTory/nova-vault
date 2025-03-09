import { useCallback, useContext, useEffect, useState } from "react";
import "../components/modals/modals.css";
import "./notif.css";
import { fetchNftSales, fetchNotificationNFTs, INFURA_URL } from "../services/nfts";
import { AppContext } from "../context";
import { addBigDecimals, createERC1155ContractInstance, createGalleryContractInstance, createNftSubmitContractInstance, divideBigDecimals, ERC20_ADDRESS, getTokenAmount, NFT_LIBRARY_ADDRESS, NFT_MARKET_ADDRESS, parseBigInt } from "../services/creators";
import { LoadingSpinner } from "../components/loading";
import { AiOutlineClose } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { getFullDateWithTime, parseNftMetaData, shortenAddy } from "../utils";
import { HiMiniBellAlert } from "react-icons/hi2";
import { ethers } from "ethers";
import { Contract } from "ethers";
import { GiReceiveMoney } from "react-icons/gi";
import NoData from "../components/noData";

const NotificationModal = ({ contract, data, loading, closeModal, notificationLen }) => {

    const navigate = useNavigate();

    const shortenAddy_ = useCallback((addy) => {
        if(addy === contract.address) return "You";
        if(!loading) return shortenAddy(addy);
        else return "";
    }, [loading]);

    const getDate_ = useCallback((date) => {
        if(!loading) return getFullDateWithTime(date, 1000);
        else return "";
    }, [loading]);

    const handleNavClick = useCallback((val) => {
        closeModal();
        navigate(`/app/asset-review/${val.nft_library_id}/${val.gallery_id}`);
    }, []);

    return (
        <div className="__Modal__Overlay__ __Notification__">
            <div className="__Modal__Container__">
                <div className="Create_Data">
                    <div className="modal-content">
                        <div className="modal-header j-space-between">
                            <span className="txt-white">Notifications</span>
                            <button className="modal-close-btn pointer" onClick={() => closeModal()}>
                                <AiOutlineClose className="mcb-icon txt-white" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="Notification">
                                {loading && <div className="w-full">
                                    <div className="notification loading">
                                        <LoadingSpinner width={"42px"} height={"42px"} />
                                    </div>
                                </div>}
                                
                                {(!loading && data.length === 0) && <div className="notif-no-data">
                                    <NoData text={`No activity yet.`} />
                                </div>}

                                {(!loading && data.length > 0) && <div className="w-full">
                                    <div className="notification">
                                        <ul className="w-full">
                                            {data.map((val, idx) => (
                                                <li className="notif-li w-full" key={`notif-li-${idx}`}>
                                                    {
                                                        val.from ?
                                                        <div className="notif-link no-hover txt-white">
                                                            <div className={`notif-li-div w-full ${idx + 1 <= notificationLen}`}>
                                                                <div className="notif-div-icon">
                                                                    <GiReceiveMoney className="notif-icon txt-white" />
                                                                </div>
                                                                <div className="notif-txt">
                                                                    <span className="notif-desc txt-white">
                                                                        {`${shortenAddy_(val.from)} sent you `}
                                                                        <strong>{`${val.amount} NOVA`}</strong>
                                                                    </span>
                                                                    <span className="notif-base">
                                                                        <span className="notif-date txt-white">
                                                                            {getDate_(val.date)}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        :
                                                        (
                                                            val.new_owner ?
                                                            <div className="notif-link no-hover txt-white">
                                                                <div className={`notif-li-div w-full ${idx + 1 <= notificationLen}`}>
                                                                    <div className="notif-div-img">
                                                                        <img src={val.img} alt="" />
                                                                    </div>
                                                                    <div className="notif-txt">
                                                                        <span className="notif-desc txt-white">
                                                                            {` ${shortenAddy_(val.new_owner)} bought your ${val.name} Nft`}
                                                                        </span>
                                                                        <span className="notif-base">
                                                                            <span className="notif-date txt-white">
                                                                                {getDate_(val.date)}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            :
                                                            <div className="notif-link txt-white pointer" 
                                                            onClick={() => handleNavClick(val)}>
                                                                <div className={`notif-li-div w-full ${idx + 1 <= notificationLen}`}>
                                                                    <div className="notif-div-icon">
                                                                        <HiMiniBellAlert className="notif-icon txt-white" />
                                                                    </div>
                                                                    <div className="notif-txt">
                                                                        <span className="notif-desc txt-white">
                                                                            {` ${shortenAddy_(val.creator)} submitted an Nft to gallery ${val.gallery_id}`}
                                                                        </span>
                                                                        <span className="notif-base">
                                                                            <span className="notif-date txt-white">
                                                                                {getDate_(val.date)}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Notification = ({ closeModal, showNotification, setNotificationLen, notificationLen }) => {

    const { contract, wallet, setWallet } = useContext(AppContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [galleryIds, setGalleryIds] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [trackChanges, setTrackChanges] = useState({});
    const [trackWalletChanges, setTrackWalletChanges] = useState({});
    const [trackSalesChanges, setTrackSalesChanges] = useState({});
    const [provider, setProvider] = useState(null);

    // const address = "0xa778cE308fcB1d35db8B2E40d86d979387b31965";

    const fetchNotifs = async () => {
        try {
            setLoading(true);

            const contractInstance = await createGalleryContractInstance(contract.signer);
            const len = await contractInstance.getLenUc(contract.address, 0);
            const ids = await Promise.all(
                Array(String(len) - 0).fill(0).map((v, i) => {
                    return contractInstance.getUc(parseBigInt(i), contract.address, 0).then(res => res);
                })
            );
            setGalleryIds(ids);
            const res = await fetchNotificationNFTs(contract.signer, ids);
            const res_ = await fetchNftSales(contract.signer, contract.address);

            const sorted_res = [...res, ...res_].sort((a, b) => {
                return b.date > a.date ? 1 : b.date < a.date ? -1 : 0
            });

            setData(sorted_res);
            setLoading(false);
            setLoaded(true);
        } catch(err) {
            console.log(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if(contract.address) fetchNotifs();
    }, [contract.address]);

    useEffect(() => {
        const provider_ = new ethers.WebSocketProvider(INFURA_URL);
        setProvider(provider_);

        return () => {
            console.log("unmount");
            provider_.destroy();
        }
    }, []);

    // Wallet event listeners
    useEffect(() => {
        // we only want new real-time updates, so fetch all existing ones first
        // then after it has loaded, you can now be listening for new ones
        if(provider && wallet.symbol && loaded) { 
            const ADDRESS = ERC20_ADDRESS;
            const abi = [
                "event Transfer(address indexed from, address indexed to, uint256 value, uint64 time)"
            ];
            const walletContract = new Contract(ADDRESS, abi, provider);

            walletContract.on("Transfer", (from, to, value, time) => {
                if(to === contract.address) {
                    setTrackWalletChanges({ from, to, value, time, decimals: wallet.decimals });
                }
            });
        }
    }, [provider, wallet.symbol, contract.address, loaded]);

    useEffect(() => {
        if(trackWalletChanges.time) {
            const { value, time, decimals, from, to } = trackWalletChanges;
            const val_ = divideBigDecimals(value, decimals);
            setWallet((prev) => {
                const amt = addBigDecimals(prev.actualAmount, val_);
                return {
                    ...prev,
                    amount: getTokenAmount(amt, decimals),
                    actualAmount: amt
                };
            });
            setData((prev) => {
                return [{ from, to, amount: val_, date: time }, ...prev];
            });
            setNotificationLen((prev) => {
                return prev + 1;
            });
        }
    }, [trackWalletChanges.time]);

    // Nft sales event listeners
    useEffect(() => {
        if(provider && contract.address && loaded) {
            const ADDRESS = NFT_MARKET_ADDRESS;
            const abi = [
                "event Sold(address indexed pre_owner, address indexed new_owner, uint256 indexed nft_id, uint64 time)"
            ];
            const salesContract = new Contract(ADDRESS, abi, provider);

            salesContract.on("Sold", (pre_owner, new_owner, nft_id, time) => {
                if(pre_owner === contract.address) {
                    setTrackSalesChanges({ pre_owner, new_owner, nft_id, time });
                }
            });
        }
    }, [provider, contract.address, loaded]);
    
    useEffect(() => {
    
        const fetchNftMetaData = async (token_id) => {
            const contractInstance = await createERC1155ContractInstance(contract.signer);
            const [gallery_id, nft_library_id, nft_id] = await contractInstance.getData(token_id);
            const nftSubmitContractInstance = await createNftSubmitContractInstance(contract.signer);
            const nft_data = await nftSubmitContractInstance.getNftData(nft_id);
            const p = parseNftMetaData(nft_data);
            return {
                ...p.metadata, gallery_id: String(gallery_id),
                nft_library_id: String(nft_library_id), nft_id: String(nft_id), token_id: String(token_id)
            };
        };

        if(trackSalesChanges.time) {
            const { new_owner, nft_id, time } = trackSalesChanges;
            fetchNftMetaData(nft_id).then(res => {
                setData((prev) => {
                    return [{ ...res, new_owner, date: time }, ...prev];
                });
                setNotificationLen((prev) => {
                    return prev + 1;
                });
            }).catch(err => {
                console.log(err);
            });
        }
    }, [trackSalesChanges.time]);

    // notification event listeners
    useEffect(() => {
        
        if(provider && loaded) {
            const ADDRESS = NFT_LIBRARY_ADDRESS;
            const abi = [
                "event SubmitedNft(uint256 indexed gallery_id, address creator, uint256 nft_index, uint64 time)"
            ];

            const newContract = new Contract(ADDRESS, abi, provider);

            newContract.on("SubmitedNft", (gallery_id, creator, nft_library_id, time) => {
                if(galleryIds.includes(gallery_id)) {
                    setTrackChanges({ 
                        gallery_id: String(gallery_id), creator, 
                        nft_library_id: String(nft_library_id), date: time, date_str: String(time)
                    });
                }
            });
        }

    }, [provider, loaded, trackChanges.date_val]);

    useEffect(() => {
        if(trackChanges.date_str) {
            setData((prev) => {
                return [{ ...trackChanges }, ...prev];
            });
            setNotificationLen((prev) => {
                return prev + 1;
            });
        }
    }, [trackChanges.date_str]);

    return (
        <span>
            {showNotification && <NotificationModal data={data} loading={loading} 
            closeModal={closeModal} notificationLen={notificationLen} contract={contract} />}
        </span>
    )
};

export default Notification;