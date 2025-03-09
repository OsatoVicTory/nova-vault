import { MdEdit } from "react-icons/md";
import "./create.css";
import { useNavigate } from "react-router-dom";

const CreateHome = () => {

    const navigate = useNavigate();

    return (
        <div className="CreateNFT w-full">
            <div className="create-nft-wrapper w-full">
                <div className="cn-content">
                    <h3 className="txt-white">Create Something</h3>
                    <p className="txt-white">Create a new gallery or a new NFT asset</p>
                    <div className="cnc w-full">
                        <div className="create-page-divs w-full">
                            <button className={`cpd- ${"show"} pointer`} onClick={() => navigate(`/app/create/gallery`)}>
                                <div className={`cpd_div w-full`}>
                                    <div className="cn-label">
                                        <div className="cncaa">
                                            <MdEdit className="cncaa-icon txt-white" />
                                        </div>
                                        <p className="txt-white">Create Gallery</p>
                                    </div>
                                </div>
                            </button>

                            <button className={`cpd- ${"show"} pointer`} onClick={() => navigate(`/app/create/asset`)}>
                                <div className={`cpd_div w-full`}>
                                    <div className="cn-label">
                                        <div className="cncaa">
                                            <MdEdit className="cncaa-icon txt-white" />
                                        </div>
                                        <p className="txt-white">Create Nft</p>
                                    </div>
                                </div>
                            </button>
                            
                            {/* <div className="cpd">
                                <div className={`cpd- ${"show"}`}>
                                    <div className={`cpd-abs ${"show"}`}>
                                        <div className="cpd-label">
                                            <div className="cpdaa">
                                                <MdEdit className="cpdaa-icon" />
                                            </div>
                                            <p>Create Nft</p>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default CreateHome;