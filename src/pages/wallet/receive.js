import { useEffect, useRef, useState, useMemo } from "react";
import "./w-modals.css";
import { MdCheck, MdContentCopy } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import { FaCheck } from "react-icons/fa6";
import useClickOutside from "../../hooks/useClickOutside";
import { setMessageFn } from "../../utils";

const Receive = ({ closeModal, setMessage }) => {

    const modalRef = useRef();
    const [message_, setMessage_] = useState("Copy address");
    const address = `0xa778cE308fcB1d35db8B2E40d86d979387b31965`;
    
    useClickOutside(modalRef, closeModal);

    const addy = useMemo(() => {
        if(window.innerWidth <= 500) return address.slice(25) + "..." + address.slice(-12);
        else return address;
    }, [])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setMessage_("Copied");
            setTimeout(() => { setMessage_("Copy address"); }, 1800);
        } catch (err) {
            setMessageFn(setMessage, { status: 'error', message: 'Failed to copy.' });
        }
    };

    return (
        <div className="__Wallet__Modal__Overlay">
            <div className="wallet-modal-container" ref={modalRef}>
                <div className="wMc">
                    <div className="wmc-header w-full">
                        <button className="wmch-btn pointer" onClick={() => closeModal()}>
                            <AiOutlineClose className='wmchb-icon txt-white' />
                        </button>
                    </div>
                    <h3 className="txt-white">Receive Funds</h3>
                    <p className="txt-white">Copy your address to receive funds</p>
                    <div className="wMc-receive w-full">
                        <div className="wmcr txt-white">{addy}</div>
                        <button className="wmcr-copy pointer" onClick={() => handleCopy()}>
                            {
                                message_ === "Copy address" ?
                                <MdContentCopy className="wmcr-copy-icon white" /> :
                                <FaCheck className="wmcr-copy-icon white" />
                            }
                            <span className="white">{message_}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Receive;