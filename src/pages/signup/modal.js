import { AiOutlineClose } from "react-icons/ai";
import "../../components/modals/modals.css";
import "./signup.css";
import { useCallback, useContext, useMemo, useState } from "react";
import { MdEdit } from "react-icons/md";
import { createUserContractInstance } from "../../services/creators";
import { AppContext } from "../../context";
import { parseStringData, setMessageFn } from "../../utils";
import { sendProfileFile } from "../../services/ipfsServer";

const EditUserModal = ({ closeModal }) => {

    const { user, setUser, contract, setMessage } = useContext(AppContext);
    const [pfpFile, setPfpFile] = useState({});
    const [bannerFile, setBannerFile] = useState({});
    const [data, setData] = useState({ ...user });
    const [loading, setLoading] = useState(false);
    
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handlePfpFileChange = useCallback((e) => {
        if(pfpFile.name) URL.revokeObjectURL(pfpFile);
        const file = e.target.files[0];
        if(!file?.size) return;
        setPfpFile(file);
    }, [pfpFile.name]);

    const getPfpFileUrl = useMemo(() => {
        if(pfpFile.name) return URL.createObjectURL(pfpFile);
    }, [pfpFile.name]);

    const handleBannerFileChange = useCallback((e) => {
        if(bannerFile.name) URL.revokeObjectURL(bannerFile);
        const file = e.target.files[0];
        if(!file?.size) return;
        setBannerFile(file);
    }, [bannerFile.name]);

    const getBannerFileUrl = useMemo(() => {
        if(bannerFile.name) return URL.createObjectURL(bannerFile);
    }, [bannerFile.name]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });
            setLoading(true);

            const img_ = { url: user.img, pub_id: user.img_public_id, b: user.image_banner, b_id: user.banner_public_id };
            if(pfpFile?.size) {
                const formData = new FormData();
                formData.append('file', pfpFile);
                formData.append('filename', pfpFile.name);
                formData.append('file_type', 'image');
                if(user.img_public_id && user.img_public_id !== "undefined") {
                    formData.append("cloudinary_id", user.img_public_id);
                }
                formData.append('app_name', 'nft-nova-vault-app');

                // to server, not ipfs upload, as ipfs is for permanent storage (i.e only NFTs)
                const data_ = await sendProfileFile(formData);
                // console.log("data_", data_); 
                img_.url = data_.data.data.secure_url;
                img_.pub_id = data_.data.data.public_id;
            }

            if(bannerFile?.size) {
                const formData = new FormData();
                formData.append('file', bannerFile);
                formData.append('filename', bannerFile.name);
                formData.append('file_type', 'image');
                if(user.banner_public_id && user.banner_public_id !== "undefined") {
                    formData.append("cloudinary_id", user.banner_public_id);
                }
                formData.append('app_name', 'nft-nova-vault-app');

                const data_ = await sendProfileFile(formData);
                img_.b = data_.data.data.secure_url;
                img_.b_id = data_.data.data.public_id;
            }

            const contractInstance = await createUserContractInstance(contract.signer);
            const m_ = `name=${data.name||""}%x2description=${data.description||""}%x2`;
            const metadata = m_ + `img=${img_.url||""}%x2img_public_id=${img_.pub_id||""}%x2image_banner=${img_.b||""}%x2banner_public_id=${img_.b_id||""}`;
            const tx = await contractInstance.registerUser(data.name, data.description, metadata);
            await tx.wait();
            setUser({ name: data.name, description: data.description, ...parseStringData(metadata) });
            setMessageFn(setMessage, { status: 'success', message: 'Account updated successfully.' });
            setLoading(false);
            closeModal();
        } catch(err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    return (
        <div className="__Modal__Overlay__ SignUp_Modal">
            <div className="__Modal__Container__">
                <div className="Create_Data">
                    <div className="modal-content">
                        <div className="modal-header j-space-between">
                            <span className="txt-white">Edit your account</span>
                            <button className="modal-close-btn pointer" onClick={() => closeModal()}>
                                <AiOutlineClose className="mcb-icon txt-white" />
                            </button>
                        </div>
                        <div className="modal-body signup-modal-body">
                            <div className="create-data-form signup-page s-modal w-full">
                                <form onSubmit={handleCreate}>
                                    <div className="cdf- w-full">
                                        <div className="cdf-div">
                                            <div className="cdf-field">
                                                <label className="txt-white">Profile picture</label>
                                                <div className="cdff-image">
                                                    {pfpFile.name && <img src={getPfpFileUrl} alt="" /> }
                                                    {!pfpFile.name && <>
                                                        {
                                                            user.img ?
                                                            <img src={user.img} alt="" />
                                                            :
                                                            <div className="placeholder-img"></div>
                                                        } 
                                                    </>}
                                                    <label htmlFor="g-pfp-file" className={`cdfa-abs ${!pfpFile.name && "show"}`}>
                                                        <div className="cdf-label">
                                                            <div className="cdfl">
                                                                <MdEdit className="cdfl-icon" />
                                                            </div>
                                                            <p>Choose a file to upload</p>
                                                        </div>
                                                    </label>
                                                    <input type="file" id="g-pfp-file" onChange={handlePfpFileChange} accept="image/*" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="cdf-div">
                                            <div className="cdf-field">
                                                <label className="txt-white">Name *</label>
                                                <input placeholder="Enter your name" className="txt-white"
                                                onChange={handleChange} name="name" value={data.name || ""} required />
                                            </div>
                                            <div className="cdf-field">
                                                <label className="txt-white">Description</label>
                                                <textarea placeholder="Describe yourself" className="txt-white"
                                                onChange={handleChange} name="description" value={data.description || ""} />
                                            </div>
                                        </div>
                                        <div className="cdf-div">
                                            <div className="cdf-field">
                                                <label className="txt-white">Profile banner</label>
                                                <div className="cdff-image">
                                                    {bannerFile.name && <img src={getBannerFileUrl} alt="" /> }
                                                    {!bannerFile.name && <>
                                                        {
                                                            user.image_banner ?
                                                            <img src={user.image_banner} alt="" />
                                                            :
                                                            <div className="placeholder-img"></div>
                                                        } 
                                                    </>}
                                                    <label htmlFor="g-banner-file" className={`cdfa-abs ${!bannerFile.name && "show"}`}>
                                                        <div className="cdf-label">
                                                            <div className="cdfl">
                                                                <MdEdit className="cdfl-icon" />
                                                            </div>
                                                            <p>Choose a file to upload</p>
                                                        </div>
                                                    </label>
                                                    <input type="file" id="g-banner-file" onChange={handleBannerFileChange} accept="image/*" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cdf-submit">
                                        <input type="submit" value={loading ? "Updating..." : "Update"} />
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

export default EditUserModal;