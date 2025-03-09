import { MdCheckCircleOutline } from "react-icons/md";
import "./modals.css";

const SuccessModal = ({ closeModal, text }) => {

    return (
        <div className="__Modal__Overlay__ __SuccessModal__">
            <div className="__Modal__Container__">
                <div className="Success_Modal">
                    <div className="modal-content">
                        <div className="modal-body success-modal">
                            <div className="success-icon-div">
                                <MdCheckCircleOutline className="success-icon" />
                            </div>
                            <h3 className="txt-white">Success</h3>
                            <p className="txt-white">
                                {text || "All done ! Your request has been completed successfully. You can close this page by clicking below."}
                            </p>
                            <div className="mcm-base">
                                <button className="mcs-btn pointer" onClick={() => closeModal()}>Got it</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;