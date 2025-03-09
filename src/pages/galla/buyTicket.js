import { GoBlocked } from "react-icons/go";
import './gallery.css';
import { useCallback, useContext, useState } from "react";
import { 
    createERC20ContractInstance, createTicketSaleContractInstance, getAppAddress, 
    getTokenAmount, 
    multiplyBigDecimals, parseBigInt, TICKET_SALE_ADDRESS 
} from "../../services/creators";
import { setMessageFn } from "../../utils";
import { AppContext } from "../../context";

const BuyTicket = ({ gallery_id, gallery, successFn }) => {

    const { contract, setMessage, wallet, setWallet } = useContext(AppContext);
    const [buyLoading, setBuyLoading] = useState(false);

    const buyTicket = useCallback(async () => {
        try {
            if(buyLoading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            const bigIntAmount = parseBigInt(multiplyBigDecimals(gallery.price, wallet.decimals));
    
            if(bigIntAmount > wallet.actualAmount) {
                return setMessageFn(setMessage, { status: 'error', message: 'Insufficient funds.' });
            }

            setBuyLoading(true);

            const address = getAppAddress(TICKET_SALE_ADDRESS);
            const walletContractInstance = await createERC20ContractInstance(contract.signer);
            const approve_txn = await walletContractInstance.approve(address, bigIntAmount);
            await approve_txn.wait();

            const contractInstance = await createTicketSaleContractInstance(contract.signer);
            const txn = await contractInstance.buyTicket(parseBigInt(gallery_id));
            await txn.wait();
            
            // get new wallet bal
            const res = await walletContractInstance.balanceOf(contract.address);
            const resAmt = getTokenAmount(res, wallet.decimals);
            setWallet({ ...wallet, amount: resAmt, actualAmount: res });

            setBuyLoading(false);
            successFn();
        } catch (err) {
            setBuyLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    }, [gallery?.price, wallet.decimals, buyLoading]);

    return (
        <div className="glry-main w-full">
            <div className='not-a-member'>
                <GoBlocked className='nam-icon' />
                <h3 className="txt-white">No access to this gallery.</h3>
                <p className="txt-white">You need Buy ticket to enter this gallery.</p>
                <button className='nam-button pointer' onClick={buyTicket}>
                    {buyLoading ? " Buying..." : "Buy now"}
                </button>
            </div>
        </div>
    );
};

export default BuyTicket;