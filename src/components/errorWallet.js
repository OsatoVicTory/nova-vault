import { useCallback, useContext, useEffect, useState } from 'react';
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from '@reown/appkit/react';
import './styles.css';
import { BiSolidError } from 'react-icons/bi';
import { AppContext } from '../context';
import { createERC20ContractInstance, createUserContractInstance, getAppAddress, getDecimals, getTokenAmount } from "../services/creators";
import { BrowserProvider } from "ethers";
import { useNavigate } from "react-router-dom";
import { parseStringData, setMessageFn } from '../utils';


const NoWallet = ({ startConnect, setStartConnect }) => {

    const [loading, setLoading] = useState(false);
    const { setContract, setUser, setWallet, setMessage } = useContext(AppContext);
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');
    const navigate = useNavigate();

    async function getSignature() {
        try {

            if(!loading) setLoading(true);

            const ethersProvider = new BrowserProvider(walletProvider);
            // const ethersProvider = await new BrowserProvider(window.ethereum);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();

            const contractInstance = await createUserContractInstance(signer);
            const hasRegistered = await contractInstance.hasRegistered(address);
            setContract({ address: getAppAddress(address), actualAddress: address, signer });
            if(!hasRegistered) navigate(`/signup`);

            const user = await contractInstance.getUserInfo(address);
            // console.log("address", address);
            setUser({ name: user[0][0], description: user[0][1], ...parseStringData(user[0][2]), joinedAt: user[1][0] });

            const walletContractInstance = await createERC20ContractInstance(signer);
            const res = await walletContractInstance.balanceOf(address);
            // console.log("wallet", res);
            // res is type bigInt
            const name = await walletContractInstance.name();
            const symbol = await walletContractInstance.symbol();
            const decimals = getDecimals(await walletContractInstance.decimals());
            const resAmt = getTokenAmount(res, decimals);
            const ethPrice = String(await walletContractInstance.getPrice());
            // console.log("wallet-resAmt", resAmt, "dec", decimals);
            
            setWallet({ amount: resAmt, symbol, decimals, name, actualAmount: res, ethPrice });
            setStartConnect(false);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    useEffect(() => {
        // console.log("address - errorWallet page", address, isConnected);
        if(address && isConnected) getSignature();
    }, [address, isConnected]);
    
    const openWallet = useCallback(() => {
        if(!isConnected && !address && !loading && setLoading) {
            setLoading(true);
            open({ view: "Connect", namespace: "eip155" }); // only ethereum accounts
        }
    }, [loading, isConnected, address, setLoading]);

    useEffect(() => {
        if(startConnect && !loading) getSignature();
    }, [startConnect, loading]);

    // const openWallet = useCallback(() => {
    //     getSignature();
    // }, []);

    return (
        <div className="error-page">
            <div>
                <div className='ep-iocn-div'>
                    <BiSolidError className='ep-icon' />
                </div>
                <p className='ep-h3 txt-white'>
                    No wallet detected. Connect your wallet to continue.
                </p>
                <button className={`ep-btn ${!loading && 'pointer'}`} onClick={openWallet} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect wallet'}
                </button>
            </div>
        </div>
    );
};

export default NoWallet;