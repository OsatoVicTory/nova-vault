import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppKitProvider } from "@reown/appkit/react";
import "./styles.css";
import { MdSwapHoriz } from "react-icons/md";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import Receive from "./receive";
import Transfer from "./transfer";
import { LoadingSpinner, Skeleton } from "../../components/loading";
import TxnsLoading from "./txns_loading";
import ChartComponent from "../../components/charts";
import useResizeThrottle from "../../hooks/useResize";
import { AppContext } from "../../context";
// import { data } from "react-router-dom";
import { fetchWalletTransactions, getWalletTimeChartData } from "../../services/wallet";
import { createERC20ContractInstance, formatEthBalance, getDecimals, getTokenAmount } from "../../services/creators";
import NoData from "../../components/noData";
import { getDateWithoutTime, getFullDateWithTime, setMessageFn } from "../../utils";
import Buy from "./buy";
import { BrowserProvider } from "ethers";
import SuccessModal from "../../components/modals/success";

const Wallet = () => {

    const { walletProvider } = useAppKitProvider('eip155');
    const { scrollPosition, contract, setWallet, wallet, setMessage } = useContext(AppContext);
    const [walletLoading, setWalletLoading] = useState(true);
    const [error, setError] = useState(false);
    const [walletLoaded, setWalletLoaded] = useState(false);
    const [market, setMarket] = useState(0);

    const [txnsLoading, setTxnsLoading] = useState(true);
    const [txns, setTxns] = useState([]);
    const [txnsError, setTxnsError] = useState(false);
    const [width, setWidth] = useState(window.innerWidth);
    const [modal, setModal] = useState('');
    const [range, setRange] = useState(20);
    const [isLoaded, setIsLoaded] = useState(false);
    const [successModalText, setSuccessModalText] = useState("");
    const stopFetching = useRef();

    const [chart, setChart] = useState({ dataset: [], labels: [], loaded: false });

    const fetchChartData = useCallback((res) => {
        // the response here has been reversed properly already by getWalletTimeCahrtData fn
        //  because res holds from most recent to least recent history like Mar 9 - Mar 5
        // so reverse so it becomes like Mar 5 - Mar 9
        const { labels, data_rec, data_trans } = getWalletTimeChartData(res); 
        if(labels.length > 0) {
            labels.unshift("Start");
            data_rec.unshift(0);
            data_trans.unshift(0);
        }
        setChart({
            labels: labels, 
            loaded: true,
            dataset: [
                {
                    data: data_rec,
                    label: "Earnings",
                    borderColor: "#25d366",
                    pointBackgroundColor: "#fff" // for tooltip
                },
                {
                    data: data_trans,
                    label: "Spendings",
                    borderColor: "rgb(240, 57, 57)",
                    pointBackgroundColor: "#fff"
                }
            ],
            changed: new Date().getTime() / 1000,
        });
    }, []);

    const fetchWallet = useCallback(async () => {
        setWalletLoading(true);
        setError(false);
        try {

            const ethersProvider = new BrowserProvider(walletProvider);
            const bal = await ethersProvider.getBalance(contract.address);
            const balEth = formatEthBalance(bal);

            const walletContractInstance = await createERC20ContractInstance(contract.signer);
            const res = await walletContractInstance.balanceOf(contract.address);
            // res is type bigInt
            const name = await walletContractInstance.name();
            const symbol = await walletContractInstance.symbol();
            const decimals = getDecimals(await walletContractInstance.decimals());
            const resAmt = getTokenAmount(res, decimals);
            const ethPrice = String(await walletContractInstance.getPrice());
            const mart = String(await walletContractInstance.getMarket());
            setMarket(mart);
            
            setWallet({ amount: String(resAmt), symbol, decimals, name, actualAmount: res, ethPrice, balEth });
            setWalletLoading(false);
            setWalletLoaded(true);
            
        } catch (err) {
            setError("wallet");
            setWalletLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    }, []);

    const fetchTxns = useCallback(async () => {
        setTxnsLoading(true);
        setTxnsError(false);
        try {
            const res = (await fetchWalletTransactions(contract.signer, contract.address)); // already reversed
            // console.log("txns", res);
            fetchChartData(res);
            setTxns(res);
            setIsLoaded(true);
            setTxnsLoading(false);
        } catch (err) {
            console.log(err);
            if(!isLoaded) setTxnsError(true);
            setTxnsLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    }, []);
    
    const fetchData = useCallback(() => {
        if(!walletLoaded) fetchWallet();
        if(!isLoaded) fetchTxns();
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    useResizeThrottle(setWidth);

    const fn = useCallback(() => {
        // console.log("fn", range, stopFetching.current, y >= scrollHeight - offsetHeight - 1);
        if(stopFetching.current) return;
        const { y, scrollHeight, offsetHeight } = scrollPosition;
        if(y >= scrollHeight - offsetHeight - 1) {
            setTxnsLoading(true);
            setRange((prev) => prev + 10);
        }
    }, []);

    useEffect(() => {
        // const { scrollTop as y, scrollLeft as x, scrollHeight, offsetHeight } = e.target;
        // console.log("scrollPosition", scrollPosition, isLoaded);
        if(isLoaded && txns.length > 0) fn();
    }, [scrollPosition.y, isLoaded, txns.length]);

    const displayableData = useMemo(() => {
        if(isLoaded && txnsLoading) setTxnsLoading(false);
        // console.log("inside-memo", range, txns.length, stopFetching.current);
        const res = txns.slice(0, range);
        if(isLoaded && range > txns.length) stopFetching.current = true;
        return res;
    }, [range, txns.length, isLoaded, txnsLoading]);

    const getAddress = useCallback((addy) => {
        if(!addy) return "";
        let mul = 0.01;
        if(width <= 600) mul = 0.024;
        const v = Math.floor((width * mul) / 2);
        return addy.slice(0, v + 3) + '...' + addy.slice(-v);
    }, [width]);

    const getDate = useCallback((val, full = false) => {
        if(!val) return "";
        else if(full) return getFullDateWithTime(val.date, 1000);
        else if(width <= 1190) return getDateWithoutTime(val.date, 1000);
        else return getFullDateWithTime(val.date, 1000);
    }, [width]);

    const closeModal = useCallback(() => setModal(''), []);

    const successFn = useCallback((txt) => {
        setSuccessModalText(txt);
        setModal("success");
    }, []);

    return (
        <div className="wallet w-full">
            <div className="wC w-full">
                <div className="wCh w-full">
                    <div className="wChL w-boxed">
                        <div className="wChLd w-full">
                            <div className="wchld-h w-full">
                                <span className="txt-white">Total Balance</span>
                                {!walletLoading && <button className="buy-butn pointer txt-white"
                                onClick={() => setModal("buy")}>Buy $NOVA</button>}
                            </div>
                            {!walletLoading ? 
                                <div className="wCh-h1">
                                    <h1 className="txt-white">{wallet.amount}</h1> 
                                    <div className="h1-token-symbol txt-white">$NOVA</div>
                                </div> 
                                : 
                                <div className="amount-skeleton"><Skeleton /></div>
                            }

                            {!walletLoading ?
                                <div className="wchld-b w-full">
                                    <button className="wchld-btn pointer colored" onClick={()=>setModal("receive")}>Receive</button>
                                    <button className="wchld-btn pointer txt-white" onClick={()=>setModal("transfer")}>Transfer</button>
                                </div> :
                                <div className="wchld-b w-full">
                                    <div className="wchld-btn loading colored"><Skeleton /></div>
                                    <div className="wchld-btn loading"><Skeleton /></div>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="wChR w-boxed">
                        {
                            txnsError ?
                            <div className="canvas-wallet-d w-full">
                                <div className="cw-div">
                                    <p className="txt-white">There was an error. Please try again</p>
                                    <button className="cw-button pointer">Retry</button>
                                </div>
                            </div>
                            :
                            (
                                (txnsLoading && !chart.loaded) ?
                                <div className="canvas-wallet loading"><LoadingSpinner width={'42px'} height={'42px'} /></div>
                                :
                                <ChartComponent datasets={chart.dataset} labels={chart.labels} 
                                xLabels={12} changed={chart.changed} legend={true} /> 
                            )
                        }
                    </div>
                </div>
                <div className="wCb w-full w-boxed">
                    <div className="wCbh w-full">
                        <h3 className="txt-white">Transaction History</h3>
                    </div>
                    <div className="txns w-full">
                        <div className="txns-header w-full">
                            <div className="txn">
                                <div className="txn-large">
                                    <span className="txn-sn txt-white">#</span>
                                    <div className="txn-icon-div"><MdSwapHoriz className="txn-icon txt-white" /></div>
                                    <span className="txn-type txt-white">Transaction Type</span>
                                    <span className="txn-address txt-white">Address</span>
                                    <span className="txn-amount txt-white">Amount</span>
                                    <span className="txn-date txt-white">Date</span>
                                </div>
                                <div className="txn-mobile">
                                    <div className="txn-icon-div"><MdSwapHoriz className="txn-icon txt-white" /></div>
                                    <div className="txn-txt">
                                        <span className="txn-type txt-white">Transaction Info</span>
                                    </div>
                                    <div className="txn-txt">
                                        <span className="txn-amount txt-white">Amount/Date</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {
                            txnsError ?
                            <div className="canvas-wallet-d w-full">
                                <div className="cw-div">
                                    <p className="txt-white">There was an error. Please try again</p>
                                    <button className="cw-button pointer">Retry</button>
                                </div>
                            </div>
                            :
                            (
                                (txnsLoading && !isLoaded) ?

                                <TxnsLoading /> :

                                (
                                    (isLoaded && txns.length === 0) ?
                                    <div className="canvas-wallet-d m-10 w-full">
                                        <NoData text={"No transaction done yet"} />
                                    </div>
                                    :
                                    <div className="txns-main w-full">
                                        {displayableData.map((val, idx) => (
                                            <div className="txn w-full" key={`txns-${idx}`}>
                                                {width > 600 && <div className="txn-large">
                                                    <span className="txn-sn txt-white">{idx + 1}</span>
                                                    <div className={`txn-icon-div ${val.type === "Transfer" ? "To" : "From"}`}>
                                                        {val.type === "Transfer" ?
                                                            <FaArrowUp className="txn-icon w-red" /> :
                                                            <FaArrowDown className="txn-icon w-green" />
                                                        }
                                                    </div>
                                                    <span className="txn-type txt-white">
                                                        {val.type === "Transfer" ? "Transfer to" : "Received from"}
                                                    </span>
                                                    <div className="full-address">
                                                        <div className="full-txn-address txt-white">{val.address}</div>
                                                        <span className="txn-address txt-white">{getAddress(val.address)}</span>
                                                    </div>
                                                    <span className={`txn-amount ${val.type !== "Transfer" ? 'w-green' : 'w-red'}`}>
                                                        {val.amount} <div className="ta-token-symbol txt-white">NOVA</div>
                                                    </span>
                                                    <div className="full-address">
                                                        <div className="full-txn-address for-date txt-white">{getDate(val, "full")}</div>
                                                        <span className="txn-date txt-white">{getDate(val)}</span>
                                                    </div>
                                                </div>}

                                                {width <= 600 && <div className="txn-mobile">
                                                    <div className={`txn-icon-div ${val.type === "Transfer" ? "To" : "From"}`}>
                                                        {val.type === "Transfer" ?
                                                            <FaArrowUp className="txn-icon w-red" /> :
                                                            <FaArrowDown className="txn-icon w-green" />
                                                        }
                                                    </div>
                                                    <div className="txn-txt">
                                                        <span className="txn-type txt-white">
                                                            {val.type === "Transfer" ? "Transfer to" : "Received from"}
                                                        </span>
                                                        <div className="full-address">
                                                            <div className="full-txn-address txt-white">{val.address}</div>
                                                            <span className="txn-address txt-white">{getAddress(val.address)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="txn-txt">
                                                        <span 
                                                        className={`txn-amount ${val.type !== "Transfer" ? 'w-green' : 'w-red'}`}>
                                                            {val.amount} <div className="ta-token-symbol txt-white">NOVA</div>
                                                        </span>
                                                        <div className="full-address">
                                                            <div className="full-txn-address txt-white">{getDate(val, "full")}</div>
                                                            <span className="txn-date txt-white">{getDate(val)}</span>
                                                        </div>
                                                    </div>
                                                </div>}
                                            </div>
                                        ))}

                                        {txnsLoading && <div className="txn-loading">
                                            <LoadingSpinner width={"21px"} height={"21px"} />
                                        </div>}
                                        
                                    </div>
                                )
                            )
                        }
                    </div>
                </div>
            </div>

            {modal === "receive" && <Receive closeModal={closeModal} setMessage={setMessage} />}

            {modal === "transfer" && <Transfer closeModal={closeModal} setMessage={setMessage} 
            contract={contract} wallet={wallet} setWallet={setWallet} successFn={successFn} />}
            
            {modal === "buy" && <Buy closeModal={closeModal} setMessage={setMessage} 
            contract={contract} wallet={wallet} setWallet={setWallet} market={market}successFn={successFn}  />}

            {modal === "success" && <SuccessModal closeModal={closeModal} text={successModalText} />}

        </div>
    );
};

export default Wallet;