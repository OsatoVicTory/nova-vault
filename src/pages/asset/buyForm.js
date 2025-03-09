import { useCallback, useContext, useState } from "react";
import { createERC20ContractInstance, createNftMarketContractInstance, getAppAddress, multiplyBigDecimals, NFT_MARKET_ADDRESS, parseBigInt, subtractBigDecimals } from "../../services/creators";
import { AppContext } from "../../context";
import "../../components/modals/modals.css";
import { AiOutlineClose } from "react-icons/ai";
import { compareVals, setMessageFn } from "../../utils";

const NftBuyForm = ({ closeModal, owner, token_id, nft, successFn }) => {

    const { contract, setMessage, wallet, setWallet } = useContext(AppContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            if(compareVals(data.amount, nft.qty, ">")) {
                return setMessageFn(setMessage, { status: 'error', message: `Only ${nft.qty} quantities available` });
            }

            const amount = multiplyBigDecimals(data.amount, nft.price);
            const bigIntAmount = parseBigInt(multiplyBigDecimals(amount, wallet.decimals));
    
            if(compareVals(bigIntAmount, wallet.actualAmount, ">")) {
                return setMessageFn(setMessage, { status: 'error', message: 'Insufficient funds.' });
            }

            setLoading(true);
            
            const contractInstance_ = await createERC20ContractInstance(contract.signer);

            const _address = getAppAddress(NFT_MARKET_ADDRESS);
            const approve_txn = await contractInstance_.approve(_address, bigIntAmount);
            await approve_txn.wait();

            const contractInstance = await createNftMarketContractInstance(contract.signer);
            const tx = await contractInstance.buy(owner, parseBigInt(token_id), parseBigInt(data.amount));
            await tx.wait();
            
            // remove amount from wallet
            setWallet({ 
                ...wallet, amount: subtractBigDecimals(wallet.amount, amount),
                actualAmount: subtractBigDecimals(wallet.actualAmount, bigIntAmount),
            });
            setLoading(false);
            successFn();
        } catch(err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    return (
        <div className="__Modal__Overlay__ __NftMakeOffer__">
            <div className="__Modal__Container__">
                <div className="Create_Data">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button className="modal-close-btn pointer" onClick={() => closeModal()}>
                                <AiOutlineClose className="mcb-icon txt-white" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <h3 className="txt-white">Buy NFT</h3> 
                            <p className="txt-white">Buy NFT from seller.</p>
                            <div className="create-data-form w-full">
                                <form onSubmit={handleSubmit}>
                                    <div className="nftmakeoffer-form">
                                        <div className="cdf-field">
                                            <label className="txt-white">
                                                {`Quantities to Buy (<= ${nft.qty}) *`}
                                            </label>
                                            <input placeholder="Enter an amount" type="number" 
                                            name="amount" className="txt-white" onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="cdf-submit">
                                        <input type="submit" value={loading ? "Buying..." : "Buy"} />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NftBuyForm;