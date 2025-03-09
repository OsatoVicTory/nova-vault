import "./alert.css";
import { MdError } from 'react-icons/md';
import { FaCircleCheck } from 'react-icons/fa6';
import { useContext } from "react";
import { AppContext } from "../../context";

const Alert = () => {

    const { message, nightMode } = useContext(AppContext);

    return (
        <div className={`message-alert ${nightMode?"night-mode":"light-mode"} ${message.message ? true : false}`}>
            <div className='alert'>
            {
                message.status === 'error' ?
                <MdError className='alert-icon alert-error' /> :
                <FaCircleCheck className='alert-icon alert-success' />
            }
            <span className='alert-txt txt-white'>{message.message}</span>
            </div>
        </div>
    );
};

export default Alert;