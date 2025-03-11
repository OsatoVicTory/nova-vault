import { AiOutlineClose } from "react-icons/ai";
// import "./modals.css";
import { useCallback, useContext, useMemo, useState } from "react";
import { MdEdit } from "react-icons/md";
import { AppContext } from "../../context";
import { createGalleryContractInstance, multiplyBigDecimals, parseBigInt } from "../../services/creators";
import { parseFileNameForIpfs, setMessageFn } from "../../utils";
import { sendFile } from "../../services/ipfsServer";

const CreateGallery = ({ closeModal, successFn }) => {

    const { contract, wallet, setMessage } = useContext(AppContext);
    const [pfpFile, setPfpFile] = useState({});
    const [bannerFile, setBannerFile] = useState({});
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

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

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const minDate = useMemo(() => {
        const date = new Date();
        const Z = (x) => x > 9 ? x : "0"+x;
        return (`${date.getFullYear()}-${Z(date.getMonth() + 1)}-${Z(date.getDate())}`);
    }, []);
    
    const handleCreate = async (e) => {
        e.preventDefault();
        // call successFn when successfully done
        try {
            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            setLoading(true);
            
            if(!pfpFile.size || !bannerFile.size) {
                setMessageFn(setMessage, { 
                    status: 'error', 
                    message: `You need to add a ${!pfpFile.size ? "profile" : "banner"} photo for your gallery` 
                });
                setLoading(false);
                return;
            }

            const { price, name, minimum_staking_amount } = data;
            const voting_end = parseInt((new Date(data.voting_end)).getSeconds());
            const voting_start = parseInt((new Date(data.voting_start)).getSeconds());
            // use new Date() to convert the dates to appropriate values
            
            const formData = new File([pfpFile], parseFileNameForIpfs(pfpFile.name), { type: pfpFile.type });

            const resp = await sendFile(formData); // to ipfs server
            const pfpImg = resp; // make api to upload
            
            const b_formData = new File([bannerFile], parseFileNameForIpfs(bannerFile.name), { type: bannerFile.type });

            const b_resp = await sendFile(b_formData); // to ipfs server
            const bannerImg = b_resp; // make api to upload

            
            const date = new Date().getTime();
            const meta_data = `img=${pfpImg}%x2banner_img=${bannerImg}%x2description=${data.description}%x2createdAt=${date}`;
            const price_ = parseBigInt(multiplyBigDecimals(price, wallet.decimals));
            const minimum_staking_amount_ = parseBigInt(multiplyBigDecimals(minimum_staking_amount, wallet.decimals));

            const contractInstance = await createGalleryContractInstance(contract.signer);
            const tx = await contractInstance.createGallery(name, meta_data, price_, voting_start, voting_end, minimum_staking_amount_);
            await tx.wait();
            setLoading(false); 
            successFn();
        } catch(err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    return (
        <div className="__Modal__Overlay__ __Create__Gallery__">
            <div className="__Modal__Container__">
                <div className="Create_Data">
                    <div className="modal-content">
                        <div className="modal-header j-space-between">
                            <span className="txt-white">Create Gallery</span>
                            <button className="modal-close-btn pointer" onClick={() => closeModal()}>
                                <AiOutlineClose className="mcb-icon txt-white" />
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* <h3 className="txt-white">Create Gallery</h3> */}
                            {/* <p className="txt-white">Create gallery to hold assets/nfts</p> */}
                            <div className="create-data-form w-full">
                                <form onSubmit={handleCreate}>
                                    <div className="cdf- w-full">
                                        <div className="cdf-div">
                                            <div className="cdf-field">
                                                <label className="txt-white">Profile picture *</label>
                                                <div className="cdff-image">
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
                                        <div className="cdf-div">
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
                                        <div className="cdf-div">
                                            <div className="cdf-field">
                                                <label className="txt-white">Profile banner *</label>
                                                <div className="cdff-image">
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
                                        <div className="cdf-div">
                                            <div className="cdf-field">
                                                <label className="txt-white">Voting Start *</label>
                                                <input placeholder="Enter Gallery name" type="date" name="voting_start"
                                                className="txt-white" min={minDate} onChange={handleChange} required />
                                            </div>
                                            <div className="cdf-field">
                                                <label className="txt-white">Voting End *</label>
                                                <input placeholder="Enter Entry price" type="date" name="voting_end"
                                                className="txt-white" min={minDate} onChange={handleChange} required />
                                            </div>
                                            <div className="cdf-field">
                                                <label className="txt-white">Minimum staking amount *</label>
                                                <input placeholder="Enter Entry price" type="number" name="minimum_staking_amount"
                                                className="txt-white" onChange={handleChange} step={"any"} required />
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
        </div>
    );
};

export default CreateGallery;