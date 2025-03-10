import { useCallback, useRef, useState } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import "./w-modals.css";
import { AiOutlineClose } from "react-icons/ai";
import { compareVals, setMessageFn } from "../../utils";
import { createERC20ContractInstance, ERC20_ADDRESS, getAppAddress, multiplyBigDecimals, parseBigInt, subtractBigDecimals } from "../../services/creators";

const Transfer = ({ closeModal, setMessage, contract, wallet, setWallet, successFn }) => {

    const modalRef = useRef();
    const transferRef = useRef(false);
    const [transfering, setTransfering] = useState(false);
    const [data, setData] = useState({});
    
    useClickOutside(modalRef, closeModal, transferRef);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(transfering)  return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

        setTransfering(true);
        transferRef.current = true;
        try {
            const { amount, to } = data;
            const bigIntAmount = parseBigInt(multiplyBigDecimals(amount, wallet.decimals));
    
            if(compareVals(bigIntAmount, wallet.actualAmount, ">")) {
                setTransfering(false);
                return setMessageFn(setMessage, { status: 'error', message: 'Insufficient funds.' });
            }

            const contractInstance = await createERC20ContractInstance(contract.signer);

            const address = getAppAddress(ERC20_ADDRESS);
            const approve_txn = await contractInstance.approve(address, bigIntAmount);
            await approve_txn.wait();

            const send_txn = await contractInstance.transfer(to, bigIntAmount);
            await send_txn.wait();

            setWallet({ 
                ...wallet, amount: subtractBigDecimals(wallet.amount, amount),
                actualAmount: subtractBigDecimals(wallet.actualAmount, bigIntAmount),
            });

            setTransfering(false);
            transferRef.current = false;
            successFn(`You have successfully sent ${amount} NOVA`);
        } catch (err) {
            setTransfering(false);
            transferRef.current = false;
            setMessageFn(setMessage, { status: 'error', message: 'There was an error. Please try again' });
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    return (
        <div className="__Wallet__Modal__Overlay">
            <div className="wallet-modal-container" ref={modalRef}>
                <div className="wMc w-full">
                    <div className="wmc-header w-full">
                        <button className="wmch-btn pointer" onClick={() => closeModal()}>
                            <AiOutlineClose className='wmchb-icon txt-white' />
                        </button>
                    </div>
                    <h3 className="txt-white">Transfer Funds</h3>
                    <p className="txt-white">Fill form below to send funds</p>
                    <form onSubmit={handleSubmit}>
                        <div className="wmc-field">
                            <label className="txt-white">Receivers' address</label>
                            <input placeholder="Enter recepient address" 
                            className="txt-white" name="to" onChange={handleChange} required />
                        </div>
                        <div className="wmc-field">
                            <label className="txt-white">Amount to send</label>
                            <input placeholder="Enter amount" type="number" step={"any"}
                            className="txt-white" name="amount" onChange={handleChange} required />
                        </div>
                        <div className="wmc-field-send">
                            <button className="wmcfs pointer">
                                <input type="submit" value={transfering ? "Sending..." : "Send"} className={`${!transfering&&"pointer"}`} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Transfer;