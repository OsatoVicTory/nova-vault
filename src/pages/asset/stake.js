import { useCallback, useContext, useMemo, useState } from "react";
import { 
    createERC20ContractInstance, createSafeVoteContractInstance, getAppAddress, 
    getTokenAmount, 
    multiplyBigDecimals, parseBigInt, SAFE_VOTE_ADDRESS,
    subtractBigDecimals
} from "../../services/creators";
import { AppContext } from "../../context";
import "../../components/modals/modals.css";
import { AiOutlineClose } from "react-icons/ai";
import { compareVals, setMessageFn } from "../../utils";

const StakeForm = ({ closeModal, n_id, nft, g_id, stakers, minStakingAmount, gallery, successFn, canVote }) => {

    const { contract, wallet, setMessage, setWallet } = useContext(AppContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const vote = useMemo(() => {
        return stakers.find(staker => staker.staker === contract.address) || {};
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            setLoading(true);
            const { amount } = data;
            const { nft_library_id, nft_id } = nft; // String ids for nft_libray and nft_submit (or metadata)
            if(compareVals(amount, minStakingAmount, "<")) {
                return setLoading(false);
            }
    
            const bigIntAmount = parseBigInt(multiplyBigDecimals(amount, wallet.decimals));
            let canVoteBigInt = null;
            let sub_ = 0;

            if(canVote !== true) {
                canVoteBigInt = parseBigInt(multiplyBigDecimals(canVote, wallet.decimals));
                sub_ = subtractBigDecimals(bigIntAmount, canVoteBigInt);
            }

            if(canVote !== true && sub_ <= 0) {
                setLoading(false);
                return setMessageFn(setMessage, { status: 'error', message: 'New vote must be greater than previous one.' });
            }
    
            if(
                (canVote === true && compareVals(bigIntAmount, wallet.actualAmount, ">")) 
                || 
                (compareVals(sub_, wallet.actualAmount, ">"))
            ) {
                setLoading(false);
                return setMessageFn(setMessage, { status: 'error', message: 'Insufficient funds.' });
            }

            const contractInstance = await createERC20ContractInstance(contract.signer);

            const vote_address = getAppAddress(SAFE_VOTE_ADDRESS);
            const approve_txn = await contractInstance.approve(vote_address, bigIntAmount);
            await approve_txn.wait();

            const voteContractInstance = await createSafeVoteContractInstance(contract.signer);
            // console.log(vote, amount, wallet, bigIntAmount, "gallery", gallery);

            if(!vote?.vote_id) {
                const stake_txn = await voteContractInstance.castVote(g_id, parseBigInt(nft_library_id), bigIntAmount);
                await stake_txn.wait();
            
                // get new wallet balance
                const res = subtractBigDecimals(wallet.actualAmount, bigIntAmount);
                const resAmt = getTokenAmount(res, wallet.decimals);
                setWallet({ ...wallet, amount: resAmt, actualAmount: res });
            } else {
                const stake_txn = await voteContractInstance.increaseCast(
                    g_id, parseBigInt(nft_library_id), parseBigInt(vote.vote_id), bigIntAmount
                );
                await stake_txn.wait();
            
                // get new wallet balance
                const res = subtractBigDecimals(wallet.actualAmount, sub_);
                const resAmt = getTokenAmount(res, wallet.decimals);
                setWallet({ ...wallet, amount: resAmt, actualAmount: res });
            }

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
                            <h3 className="txt-white">Stake on an NFT</h3> 
                            <p className="txt-white">
                                {
                                    canVote === true ?
                                    "Stake on your vote for this NFT."
                                    :
                                    `Increase your vote from ${canVote} for this NFT.`
                                }
                            </p>
                            <div className="create-data-form w-full">
                                <form onSubmit={handleSubmit}>
                                    <div className="nftmakeoffer-form">
                                        <div className="cdf-field">
                                            <label className="txt-white">{`Stake amount >= ${minStakingAmount} NOVA *`}</label>
                                            <input type="number" step={"any"}
                                            placeholder={!vote.id ? `Enter an amount` : `Increase amount from ${vote.stake_amount} NOVA`} 
                                            name="amount" className="txt-white" onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="cdf-submit">
                                        <input type="submit" value={loading ? "Staking..." : "Stake"} />
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

export default StakeForm;