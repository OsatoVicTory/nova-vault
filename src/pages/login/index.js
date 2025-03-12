import { useAppKitProvider, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useAppKit } from '@reown/appkit/react';
import "./styles.css";
import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../../context";
import { createERC20ContractInstance, createUserContractInstance, getAppAddress, getDecimals, getTokenAmount } from "../../services/creators";
import { BrowserProvider } from "ethers";
import { useNavigate } from "react-router-dom";
import { parseStringData, setMessageFn } from "../../utils";
import { MdAccountBalanceWallet } from "react-icons/md";
import logo from "../../assets/novaVault-logo-nobg.png";
import banner from "../../assets/wallet.png";

const Login = () => {

    const { setContract, setUser, setWallet, setMessage } = useContext(AppContext);
    const { open } = useAppKit();
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function getSignature() {
        try {

            setLoading(true);
            const ethersProvider = new BrowserProvider(walletProvider);
            // const ethersProvider = new BrowserProvider(window.ethereum);
            const signer = await ethersProvider.getSigner();
            const address_ = getAppAddress(await signer.getAddress());
            setContract({ address: address_, actualAddress: address_, signer });

            const contractInstance = await createUserContractInstance(signer);
            const hasRegistered = await contractInstance.hasRegistered(address_);
            if(hasRegistered) {
                const user = await contractInstance.getUserInfo(address_);
                setUser({ name: user[0][0], description: user[0][1], ...parseStringData(user[0][2]), joinedAt: user[1][0] });
                
                const walletContractInstance = await createERC20ContractInstance(signer);
                const res = await walletContractInstance.balanceOf(address_);
                // res is type bigInt
                const name = await walletContractInstance.name();
                const symbol = await walletContractInstance.symbol();
                const decimals = getDecimals(await walletContractInstance.decimals());
                const resAmt = getTokenAmount(res, decimals);
                const ethPrice = String(await walletContractInstance.getPrice());
                // const bal = await ethersProvider.getBalance(address_);
                // console.log("ethPrice", ethPrice, "bal", bal);
                
                setWallet({ amount: resAmt, symbol, decimals, name, actualAmount: res, ethPrice });

                setLoading(false);
                navigate(`/app`);
            } else {
                setLoading(false);
                navigate(`/signup`);
            }
        } catch (err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    // useEffect(() => {
    //     console.log("address", address, isConnected);
    //     if(isConnected && address) getSignature();
    // }, [address, isConnected]);

    const startConnect = useCallback(async () => {
        if (!isConnected && !address) {
            setLoading("sign");
            open({ view: "Connect", namespace: "eip155" }); // only ethereum accounts
        } else {
            setLoading(true);
            await disconnect();
            await new Promise((res) => setTimeout(res, 600));
            open({ view: "Connect", namespace: "eip155" }); // only ethereum accounts
            setLoading("sign");
        }
    }, [isConnected, address]);

    useEffect(() => {
        if(loading === "sign" && isConnected && walletProvider) {
            getSignature();
        }
    }, [loading, isConnected, address, walletProvider]);

    return (
        <div className="Login">
            <div className="landingPage">
                <div className="landing_page_wrapper">
                    <div className="lpw-content">
                        <div className="novaV_logo">
                            <img src={logo} alt="logo" />
                        </div>
                        <h3>Connect Wallet</h3>
                        <p>Connect your wallet to get started</p>
                        <div className="connect-wallet-btn pointer" onClick={startConnect}>
                            <MdAccountBalanceWallet className='cwb-icon' />
                            <span className='cwb-txt'>{loading ? 'Connecting...' : 'Connect'}</span>
                        </div>
                    </div>
                </div>
                <div className="lp-banner">
                    <div className="lpb-img">
                        <img src={banner} alt="banner" />
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Login;