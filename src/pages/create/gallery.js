import { AiOutlineClose } from "react-icons/ai";
import "./gallery.css";
import { useCallback, useContext, useMemo, useState } from "react";
import { MdEdit } from "react-icons/md";
import { createGalleryContractInstance, multiplyBigDecimals, parseBigInt, parseBigIntDecimal } from "../../services/creators";
import { AppContext } from "../../context";
import SuccessModal from "../../components/modals/success";
import { sendFile } from "../../services/ipfsServer";
import { parseFileNameForIpfs, setMessageFn } from "../../utils";
import { useNavigate } from "react-router-dom";

const CreateGalleryPage = () => {

    const { contract, wallet, setMessage } = useContext(AppContext);
    const [pfpFile, setPfpFile] = useState({});
    const [bannerFile, setBannerFile] = useState({});
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState("");
    const navigate = useNavigate();
    // const [showDropdown, setShowDropdown] = useState(false);

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
        // call successFn when successfully done
        try {
            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            if(!pfpFile.size || !bannerFile.size) {
                setMessageFn(setMessage, { 
                    status: 'error', 
                    message: `You need to add a ${!pfpFile.size ? "profile" : "banner"} photo for your gallery` 
                });
                return;
            }

            const { price, name, minimum_staking_amount } = data;
            // no error can come here as input constraints users to pick time that are in good range
            const voting_end = Number(new Date(data.voting_end).getTime() / 1000);
            const voting_start = Number(new Date(data.voting_start).getTime() / 1000);
            const date = new Date().getTime();

            if(voting_start >= voting_end) {
                return setMessageFn(setMessage, { status: 'error', message: 'Voting Start time cannot be >= Voting end time.' });
            }

            setLoading(true);
            
            const formData = new File([pfpFile], parseFileNameForIpfs(pfpFile.name), { type: pfpFile.type });

            const resp = await sendFile(formData); // to ipfs server
            const pfpImg = resp; // make api to upload
            
            const b_formData = new File([bannerFile], parseFileNameForIpfs(bannerFile.name), { type: bannerFile.type });

            const b_resp = await sendFile(b_formData); // to ipfs server 
            const bannerImg = b_resp; // make api to upload

            const meta_data = `img=${pfpImg}%x2banner_img=${bannerImg}%x2description=${data.description}%x2createdAt=${date}`;
            const price_ = parseBigInt(multiplyBigDecimals(price, wallet.decimals));
            const minimum_staking_amount_ = parseBigInt(multiplyBigDecimals(minimum_staking_amount, wallet.decimals));
            
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const tx = await contractInstance.createGallery(name, meta_data, price_, voting_start, voting_end, minimum_staking_amount_);
            await tx.wait();
            setLoading(false);
            setModal("success"); 
        } catch(err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const minDate = useMemo(() => {
        const date = new Date();
        const Z = (x) => x > 9 ? x : "0"+x;
        return (`${date.getFullYear()}-${Z(date.getMonth() + 1)}-${Z(date.getDate())}T${Z(date.getHours())}:${Z(date.getMinutes())}`);
    }, []);

    const closePage = useCallback(() => {
        navigate(-1);
    }, []);

    return (
        <div className="__Create__Gallery__">
            <div className="__Container__">
                <div className="Create_Data">
                    <div className="cgc-content">
                        <div className="cgc-header">
                            <button className="cgc-close-btn pointer" onClick={closePage}>
                                <AiOutlineClose className="cgc-icon txt-white" />
                            </button>
                            <h3 className="txt-white">Create Gallery</h3>
                        </div>
                        <div className="cgc-body">
                            {/* <h3 className="txt-white">Create Gallery</h3> */}
                            <p className="txt-white">Create gallery to hold assets/nfts</p>
                            <div className="create-data-form w-full">
                                <form onSubmit={handleCreate}>
                                    <div>
                                        <div className="cdf-d w-full">
                                            <div className="cdf-div cdf-pic">
                                                <div className="cdf-field">
                                                    <label className="txt-white">Profile picture *</label>
                                                    <div className="cdff-image cdff-i-min">
                                                        {pfpFile.name && <img src={getPfpFileUrl} alt="" /> }
                                                        {!pfpFile.name && <div className="placeholder-img"></div> }
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
                                            <div className="cdf-div cdf-fields">
                                                <div className="cdf-field">
                                                    <label className="txt-white">Name *</label>
                                                    <input placeholder="Enter Gallery name" name="name"
                                                    className="txt-white" onChange={handleChange} required />
                                                </div>
                                                <div className="cdf-field">
                                                    <label className="txt-white">Entry price (in $NOVA) *</label>
                                                    <input placeholder="Enter Entry price" type="number" name="price"
                                                    className="txt-white" onChange={handleChange} step={"any"} required />
                                                </div>
                                                <div className="cdf-field">
                                                    <label className="txt-white">Description</label>
                                                    <textarea placeholder="Describe the Gallery" 
                                                    className="txt-white" onChange={handleChange} name="description" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="cdf-d w-full">
                                            <div className="cdf-div cdf-pic">
                                                <div className="cdf-field">
                                                    <label className="txt-white">Profile banner *</label>
                                                    <div className="cdff-image cdff-i-min">
                                                        {bannerFile.name && <img src={getBannerFileUrl} alt="" /> }
                                                        {!bannerFile.name && <div className="placeholder-img"></div> }
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
                                            <div className="cdf-div cdf-fields">
                                                <div className="cdf-field">
                                                    <label className="txt-white">Voting Start *</label>
                                                    <input placeholder="Enter Gallery name" type="datetime-local" name="voting_start"
                                                    className="txt-white" min={minDate} onChange={handleChange} required />
                                                </div>
                                                <div className="cdf-field">
                                                    <label className="txt-white">Voting End *</label>
                                                    <input placeholder="Enter Entry price" type="datetime-local" name="voting_end"
                                                    className="txt-white" min={minDate} onChange={handleChange} required />
                                                </div>
                                                <div className="cdf-field">
                                                    <label className="txt-white">Minimum staking amount *</label>
                                                    <input placeholder="Enter Entry price" type="number" name="minimum_staking_amount"
                                                    className="txt-white" onChange={handleChange} step={"any"} required />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cdf-submit">
                                        <input type="submit" value={loading ? "Creating..." : "Create"} />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {modal === "success" && <SuccessModal text={"Your Gallery has been created succesfully."} 
                closeModal={() => {
                    setModal("");
                    navigate("/app");
                }} 
            />}

        </div>
    );
};

export default CreateGalleryPage;