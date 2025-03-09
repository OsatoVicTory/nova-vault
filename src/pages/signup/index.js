import "../../components/modals/modals.css";
import "./signup.css";
import { useCallback, useContext, useMemo, useState } from "react";
import { MdEdit } from "react-icons/md";
import { createUserContractInstance } from "../../services/creators";
import { AppContext } from "../../context";
import { useNavigate } from "react-router-dom";
import { parseStringData, setMessageFn } from "../../utils";
import logo from "../../assets/novaVault-logo-nobg.png";
import banner from "../../assets/phone_banner.png";
import { sendProfileFile } from "../../services/ipfsServer";

const Signup = () => {

    const navigate = useNavigate();
    const { setUser, contract, setMessage } = useContext(AppContext);
    const [pfpFile, setPfpFile] = useState({});
    const [bannerFile, setBannerFile] = useState({});
    const [data, setData] = useState({});
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
        if(loading)  return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

        setLoading(true);
        try {

            const img_ = { url: "", pub_id: "", b: "", b_id: "" };
            if(pfpFile?.size) {
                const formData = new FormData();
                formData.append('file', pfpFile);
                formData.append('filename', pfpFile.name);
                formData.append('file_type', 'image');
                formData.append('app_name', 'nft-nova-vault-app');

                const data_ = await sendProfileFile(formData); // to server, not ipfs upload, as ipfs is for permanent storage (i.e only NFTs)
                img_.url = data_.data.secure_url;
                img_.pub_id = data_.data.public_id;
            }

            if(bannerFile?.size) {
                const formData = new FormData();
                formData.append('file', bannerFile);
                formData.append('filename', bannerFile.name);
                formData.append('file_type', 'image');
                formData.append('app_name', 'nft-nova-vault-app');

                const data_ = await sendProfileFile(formData);
                img_.b = data_.data.secure_url;
                img_.b_id = data_.data.public_id;
            }

            const contractInstance = await createUserContractInstance(contract.signer);
            const m_ = Object.keys(data).map(key => `${key}=${data[key]}%x2`).join("");
            const metadata = m_ + `img=${img_.url}%x2img_public_id=${img_.pub_id}%x2image_banner=${img_.b}%x2banner_public_id=${img_.b_id}`;
            const tx = await contractInstance.registerUser(data.name, data.description, metadata);
            await tx.wait();
            setUser({ name: data.name, description: data.description, ...parseStringData(metadata) });
            setMessageFn(setMessage, { status: 'success', message: 'Account Created successfully.' });
            setLoading(false);
            navigate(`/app`);
        } catch(err) {
            console.log(err);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    return (
        <div className='signup'>
            <div className='sign-up'>
                <main className="w-full">
                    <div className='signup-content'>
                        <div className='signup-logo'>
                            <img src={logo} alt='logo' />
                        </div>
                        <h3>Set up Account</h3>
                        <p>Note that records here can be modified later on</p>
                        <div className="create-data-form signup-page s-page w-full">
                            <form onSubmit={handleCreate}>
                                <div className="cdf- w-full">
                                    <div className="cdf-div">
                                        <div className="cdf-field">
                                            <label className="txt-white">Profile picture</label>
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
                                            <input placeholder="Enter your name" className="txt-white"
                                            onChange={handleChange} name="name" required />
                                        </div>
                                        <div className="cdf-field">
                                            <label className="txt-white">Description</label>
                                            <textarea placeholder="Describe yourself" className="txt-white"
                                            onChange={handleChange} name="description" />
                                        </div>
                                    </div>
                                    <div className="cdf-div">
                                        <div className="cdf-field">
                                            <label className="txt-white">Profile banner</label>
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
                                </div>
                                <div className="cdf-submit signup-page-">
                                    <input type="submit" value={loading ? "Creating..." : "Create"} />
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
                <aside className='signup-banner'>
                    <div className='sb'>
                        <img src={banner} alt='banner' />
                        <div className='sb-txt'>
                            <h1>A Crowdsourced<br />NFT Valuation Platform.</h1>
                        </div>
                    </div>
                </aside>
            </div>

        </div>
    );
};

export default Signup;