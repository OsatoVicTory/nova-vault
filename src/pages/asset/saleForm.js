import { useCallback, useContext, useState } from "react";
import { createERC1155ContractInstance, createNftMarketContractInstance, getAppAddress, multiplyBigDecimals, NFT_MARKET_ADDRESS, parseBigInt } from "../../services/creators";
import { AppContext } from "../../context";
import "../../components/modals/modals.css";
import { AiOutlineClose } from "react-icons/ai";
import { setMessageFn } from "../../utils";

const NftSaleForm = ({ closeModal, token_id, successFn, nft }) => {

    const { contract, setMessage, wallet } = useContext(AppContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if(data.amount <= 0 || data.price <= 0) {
                return setMessageFn(setMessage, { status: 'error', message: 'Input field cannot be zero or less.' });
            }

            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            setLoading(true);
                        
            const contractInstance_ = await createERC1155ContractInstance(contract.signer);
            const _address = getAppAddress(NFT_MARKET_ADDRESS);
            const approve_txn = await contractInstance_.setApprovalForAll(_address, true);
            await approve_txn.wait();

            const contractInstance = await createNftMarketContractInstance(contract.signer);
            const price = parseBigInt(multiplyBigDecimals(data.price, wallet.decimals));
            const tx = await contractInstance.offer(parseBigInt(token_id), parseBigInt(data.amount), price, true);
            await tx.wait();
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
                            <h3 className="txt-white">Sell your NFT</h3> 
                            <p className="txt-white">
                                {nft.qty > 0 ? "Change price or qty." : "Put your NFT up for sale to buyers."}
                            </p>
                            <div className="create-data-form w-full">
                                <form onSubmit={handleSubmit}>
                                    <div className="nftmakeoffer-form">
                                        <div className="cdf-field">
                                            <label className="txt-white">Quantities for Sale *</label>
                                            <input placeholder={nft.qty > 0 ? nft.qty : "Enter an amount"} type="number" 
                                            name="amount" className="txt-white" onChange={handleChange} required />
                                        </div>
                                        <div className="cdf-field">
                                            <label className="txt-white">Price *</label>
                                            <input placeholder={nft.price > 0 ? nft.price : "Enter a price"} 
                                            type="number" step={"any"}
                                            name="price" className="txt-white" onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="cdf-submit">
                                        <input type="submit" value={loading ? "Saving..." : "Save"} />
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

export default NftSaleForm;