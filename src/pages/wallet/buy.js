import { useCallback, useMemo, useRef, useState } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import "./w-modals.css";
import { AiOutlineClose } from "react-icons/ai";
import { compareVals, parseAmount, setMessageFn } from "../../utils";
import { 
    addBigDecimals, createERC20ContractInstance, getPriceInEth, multiplyBigDecimals, parseBigInt, parseEth
} from "../../services/creators";

const Buy = ({ closeModal, setMessage, contract, wallet, setWallet, market, successFn }) => {

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
            const { amount } = data;
            const bigIntAmount = parseBigInt(multiplyBigDecimals(amount, wallet.decimals));
            const amountInEth = getPriceInEth(amount, wallet.ethPrice, 0, wallet.decimals);

            if(compareVals(bigIntAmount, market, ">")) {
                setTransfering(false);
                return setMessageFn(setMessage, { status: 'error', message: 'Amount above market supply.' });
            }  

            if(compareVals(amountInEth, wallet.balEth, ">")) {
                setTransfering(false);
                return setMessageFn(setMessage, { status: 'error', message: 'Insufficient ETH in wallet.' });
            }             
            
            const value = parseEth(amountInEth);

            const contractInstance = await createERC20ContractInstance(contract.signer);
            const txn = await contractInstance.buy({ value });
            await txn.wait();

            setWallet({ 
                ...wallet, amount: addBigDecimals(wallet.amount, amount),
                actualAmount: addBigDecimals(wallet.actualAmount, bigIntAmount),
            });

            setTransfering(false);
            transferRef.current = false;
            successFn(`You have successfully bought ${amount} NOVA`);
        } catch (err) {
            console.log(err);
            setTransfering(false);
            transferRef.current = false;
            setMessageFn(setMessage, { status: 'error', message: 'There was an error. Please try again' });
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const EthAmt = useMemo(() => {
        return data.amount ? getPriceInEth(data.amount, wallet.ethPrice, false, wallet.decimals) : 0;
    }, [data.amount, wallet.ethPrice]);

    return (
        <div className="__Wallet__Modal__Overlay">
            <div className="wallet-modal-container" ref={modalRef}>
                <div className="wMc w-full">
                    <div className="wmc-header w-full">
                        <button className="wmch-btn pointer" onClick={() => closeModal()}>
                            <AiOutlineClose className='wmchb-icon txt-white' />
                        </button>
                    </div>
                    <h3 className="txt-white">Buy NOVA tokens with ETH</h3>
                    <p className="txt-white">{`Available ETH: ${wallet.balEth} ETH`}</p>
                    <p className="txt-white">{`Available NOVA supply: ${parseAmount(market)} NOVA`}</p>
                    <form onSubmit={handleSubmit}>
                        <div className="wmc-field">
                            <label className="txt-white">
                                {`Amount in ETH: ${EthAmt} ETH`}
                            </label>
                        </div>
                        <div className="wmc-field">
                            <label className="txt-white">Amount in NOVA to buy</label>
                            <input placeholder="Enter amount" type="number" step={"any"}
                            className="txt-white" name="amount" onChange={handleChange} required />
                        </div>
                        <div className="wmc-field-send">
                            <button className="wmcfs pointer">
                                <input type="submit" value={transfering ? "Buying..." : "Buy"} className={`${!transfering&&"pointer"}`} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Buy;