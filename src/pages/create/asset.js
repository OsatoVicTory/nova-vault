import { MdEdit, MdKeyboardArrowDown } from "react-icons/md";
import "./create.css";
import { BsSend } from "react-icons/bs";
import { useCallback, useState, useMemo, useEffect, useContext } from "react";
import { parseFileNameForIpfs, parseGalleryData, setMessageFn } from "../../utils";
import AttributesSelector from "./attributesModal";
import CreateGallery from "../../components/modals/gallery";
import SuccessModal from "../../components/modals/success";
import { createGalleryContractInstance, createNftSubmitContractInstance, parseBigInt } from "../../services/creators";
import { LoadingSpinner } from "../../components/loading";
import { AppContext } from "../../context";
import { useLocation, useNavigate } from "react-router-dom";
import { sendFile } from "../../services/ipfsServer";
import { AssetFileToUpload } from "./assetFileToUpload";
import { AiOutlineClose } from "react-icons/ai";

const CreateNFT = () => {

    const { contract, setMessage } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [assetFile, setAssetFile] = useState({});
    const [thumbnail, setThumbnail] = useState({});
    const [options, setOptions] = useState({});
    const [showDropdown, setShowDropdown] = useState(false);
    const [modal, setModal] = useState("");
    const [attributes, setAttributes] = useState("");
    const [myGalleries, setMyGalleries] = useState([]);
    const [myGalleriesError, setMyGalleriesError] = useState(false);
    const [myGalleriesLoading, setMyGalleriesLoading] = useState(true);
    const { state, key } = useLocation();
    const navigate = useNavigate();
    const [selectedGallery, setSelectedGallery] = useState({});
    const file_types = [
        {name: ".jpeg", file_type: "image"},
        {name: ".jpg", file_type: "image"},
        {name: ".png", file_type: "image"},
        {name: ".gif", file_type: "image"},
        {name: ".mp3", file_type: "audio"},
        {name: ".mp4", file_type: "video"},
    ];
    
    const fetchGallery = async (index, contractInstance) => {
        const id = await contractInstance.getUc(index, contract.address, 0);
        const res_ = await contractInstance.getGallery(id);
        return { ...parseGalleryData(res_), gallery_id: String(index + 1n) }; // + 1n for a reason
    };

    const fetchUserGalleries = async () => {
        try {
            setMyGalleriesLoading(true);
            setMyGalleriesError(false);
            if(state?.galleryData?.name) {
                setSelectedGallery(state.galleryData);
                setMyGalleriesLoading(false);
                return;
            }
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const len = await contractInstance.getLenUc(contract.address, 0);
            const res_ = await Promise.all(
                Array((len + "") - 0).fill(0).map((v, i) => {
                    return fetchGallery(parseBigInt(i), contractInstance).then(res => res);
                })
            );
            const dt = new Date().getTime() / 1000;
            // only gallery that voting has not started as tey are d only ones that accept creating new nfts
            const res = res_.filter(re => re.votingStart > dt); 
            setMyGalleries(res);
            setMyGalleriesLoading(false);
        } catch (err) {
            setMyGalleriesError(true);
            setMyGalleriesLoading(false);
        }
    };

    useEffect(() => {
        fetchUserGalleries();
        return () => {
            if(assetFile.name) URL.revokeObjectURL(assetFile);
            if(thumbnail.name) URL.revokeObjectURL(thumbnail);
        }
    }, []);

    const handleFileChange = useCallback((e) => {
        if(assetFile.name) URL.revokeObjectURL(assetFile);
        const file = e.target.files[0];
        const file_type = file_types.find(ft => file.name.endsWith(ft.name))?.file_type;
        if(!file_type) {
            setMessageFn(setMessage, { status: 'error', message: `Please select a file of any of these types ${file_types.map(v => v.name).join(", ")}.` });
            return;
        }
        if(!file?.size) return;
        setAssetFile(file);
    }, [assetFile.name]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setOptions((prev) => ({ ...prev, [name]: value }));
    }, []);

    const getAssetFileUrl = useMemo(() => {
        if(assetFile.name) {
            const file_type = file_types.find(ft => assetFile.name.endsWith(ft.name))?.file_type;
            if(file_type === "image") {
                const url = URL.createObjectURL(assetFile);
                return url;
            } else {
                const t_ = thumbnail.name ? URL.createObjectURL(thumbnail) : "";
                const url = URL.createObjectURL(assetFile);
                return { file_type, url, thumbnail: t_ };
            }
        }
    }, [assetFile.name, thumbnail.name]);

    const formatAttributes = useMemo(() => {
        return attributes.replaceAll("%x4", "; ").replaceAll("=", " ");
    }, [attributes]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if(loading) return setMessageFn(setMessage, { status: 'error', message: 'Already making a request.' });

            setLoading(true);

            const { gallery_id, minStakingAmount, votingStart } = selectedGallery;

            const date = new Date().getTime();

            // if it is 45 secs or more above votingStart don't send
            // 45 secs is for latency time to get to backend
            if(Math.floor(date / 1000) - votingStart >= 45) { 
                setLoading(false);
                setMessageFn(setMessage, { status: 'error', message: 'Cannot add NFT because the Gallery is in voting period.' });
                return;
            }

            if(!gallery_id) {
                setLoading(false);
                setMessageFn(setMessage, { status: 'error', message: 'Please select a gallery to save Nft in.' });
                return;
            }
            
            const file_type = file_types.find(ft => assetFile.name.endsWith(ft.name))?.file_type;
            const formData = new File([assetFile], parseFileNameForIpfs(assetFile.name), { type: assetFile.type });
        
            if(!file_type) {
                setLoading(false);
                setMessageFn(setMessage, { status: 'error', message: `Please select a file of any of these types ${file_types.map(v => v.name).join(", ")}.` });
                return;
            }

            // upload thumbnail if it exits too and nft assetFile is not image
            let thumbnail_ = "";
            if(thumbnail.file && file_type === "image") {
                setMessageFn(setMessage, { status: 'error', message: `Thumbnail cannot be included for image file. Uploading without thumbnail.` });
            } else if(thumbnail.file && file_type !== "image") {
                const t_formData = new File([thumbnail], parseFileNameForIpfs(thumbnail.name), { type: thumbnail.type });

                const resp_ = await sendFile(t_formData); // to ipfs server
                thumbnail_ = resp_;
            }

            // const video = "https://videocdn.cdnpk.net/videos/819f2b43-92c8-48bd-8fc6-c005cab3db7f/horizontal/previews/watermarked/large.mp4";
            // const audio = "https://805e32eeef8d79912f079b3ac853e1f3.ipfscdn.io/ipfs/bafybeihio4yubjlru4cdra64qsvfafgcea2pfrmf7zw7adswkasvap6lku/file_example_MP3_700KB.mp3";
            // const gif = "https://805e32eeef8d79912f079b3ac853e1f3.ipfscdn.io/ipfs/bafybeiaspabnv6nx35k4sp4rfdnabxlehqgcdlrs3ofup44tb6r4wskot4/SampleGIFImage_350kbmb.gif";
            // const assetImg = "https://i.seadn.io/gcs/files/642de8fe6f7326fe571351f5ed77e16b.jpg";
            // const b_resp = "https://805e32eeef8d79912f079b3ac853e1f3.ipfscdn.io/ipfs/bafybeihyumbjpp5hoy3rsbgbwtyboekoy5dbkdcd6g5ljrrmfih22qd5mm/gradient-night-sky-illustration_52683-175659.webp";
            // console.log(b_resp);

            const resp = await sendFile(formData); // to ipfs server
            const assetImg = file_type === "image" ? resp : "";
            const src = file_type === "image" ? "" : resp;
            
            
            const objStr = Object.keys(options).map(key => `${key}=${options[key]}%x2`).join("") + `attributes=${attributes}%x2file_type=${file_type}`;
            const data = objStr + `%x2img=${assetImg}%x2price=${minStakingAmount}%x2gallery_id=${gallery_id}%x2createdAt=${date}%x2src=${src}%x2thumbnail=${thumbnail_}`;
            
            const contractInstance = await createNftSubmitContractInstance(contract.signer);
            const tx = await contractInstance.submitNft(parseBigInt(gallery_id), data);
            await tx.wait();
            setLoading(false); 
            setModal("success");
        } catch(err) {
            console.log(err);
            setLoading(false); 
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' });
        }
    };

    const chooseGallery = useCallback((val) => {
        setSelectedGallery(val);
    }, [myGalleriesLoading]);

    const handleThumbnailChange = useCallback((e) => {
        setThumbnail((prev) => {
            if(prev?.name) URL.revokeObjectURL(prev);
            return e.target.files[0];
        });
    }, []);

    const cannAddthumbnail = useMemo(() => {
        if(!assetFile.type) return false;
        const file_type = file_types.find(ft => assetFile.name.endsWith(ft.name))?.file_type;
        return file_type !== "image";
    }, [assetFile.type]);

    const removeThumbnail = useCallback(() => {
        if(thumbnail.name) URL.revokeObjectURL(thumbnail);
        setThumbnail({});
    }, [thumbnail.name]);

    return (
        <div className="CreateNFT w-full">
            <div className="create-nft-wrapper w-full">
                <div className="cn-content">
                    <h3 className="txt-white">Create an NFT</h3>
                    <div className="cnc">
                        <div className="cnc-div cnc-asset pointer">
                            {
                                !assetFile.name ?
                                <div className="placeholder-img"></div> 
                                :
                                <>
                                    {
                                        getAssetFileUrl?.file_type ?
                                        <AssetFileToUpload data={getAssetFileUrl} />
                                        :
                                        <img src={getAssetFileUrl} alt="" />
                                    }
                                </>
                            }
                            <label htmlFor="asset-file" className={`cnca-abs ${!assetFile.name && "show"} ${getAssetFileUrl?.file_type && "not-image"}`}>
                                <div className="cn-label">
                                    <div className="cncaa">
                                        <MdEdit className="cncaa-icon" />
                                    </div>
                                    <p>Choose a file to upload as an asset</p>
                                </div>
                            </label>
                            <input type="file" id="asset-file" onChange={handleFileChange} />
                        </div>
                        <form className="cnc-div cnc-form" onSubmit={handleCreate}>
                            <div className="cncf-field">
                                <label className="txt-white">Gallery name *</label>
                                <div className="cncf-gallery w-full">
                                    <div className="cncfg-selected">
                                        <span className="txt-white">
                                            {selectedGallery.name || "Select a gallery"}
                                        </span>
                                        {!state?.galleryData?.name && 
                                        <MdKeyboardArrowDown onClick={() => setShowDropdown(!showDropdown)}
                                        className={`cncfg-icon txt-white ${showDropdown}`} />}
                                    </div>
                                    <div className={`cncfg-dropdown ${showDropdown}`}>
                                        <div className="cncfgd w-full">
                                            <div className="cncfgd-li" onClick={() => setModal("gallery")}>
                                                <span className="txt-white">
                                                    {"Create new Gallery"}
                                                </span>
                                            </div>
                                            {
                                                myGalleriesError ?
                                                <div className="cncfgd-div">
                                                    <div className="cncfgd-error">
                                                        <p className="txt-white">There was an error. Retry.</p>
                                                        <button className="cncfgd-error-btn pointer"
                                                        onClick={() => fetchUserGalleries()}>Retry</button>
                                                    </div>
                                                </div>
                                                :
                                                myGalleriesLoading ?
                                                <div className="cncfgd-div">
                                                    <LoadingSpinner width={"25px"} height={"25px"} />
                                                </div>
                                                :
                                                myGalleries.map((val, idx) => (
                                                    <div className="cncfgd-li" key={`cnf-${idx} pointer`}
                                                    onClick={() => chooseGallery(val)}>
                                                        <span className="txt-white">{val.name}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="cncf-field">
                                <label className="txt-white">Asset Name *</label>
                                <input placeholder="Enter a name" className="txt-white" 
                                onChange={handleChange} name="name" required />
                            </div>
                            <div className="cncf-field">
                                <label className="txt-white">Asset Description *</label>
                                <textarea placeholder="Describe the asset" className="txt-white" 
                                onChange={handleChange} name="description" required />
                            </div>
                            {cannAddthumbnail && <div className="cncf-field a-th">
                                <label className="txt-white">Add thumbnail image (only for audio or video nfts)</label>
                                <div>
                                    <label className="thumbnail-input-label pointer" htmlFor="thumbnail-input">
                                        <div className="t-choose txt-white">Choose file</div>
                                        <div className="thumbnail-input-label-span">
                                            <span className="txt-white">{thumbnail.name || "Choose a file"}</span>
                                        </div>
                                    </label>

                                    <input placeholder="Choose thumbnail image" 
                                    className="txt-white empty" id="thumbnail-input"
                                    onChange={handleThumbnailChange} type="file" accept="image/*" />

                                    {thumbnail.name && <span className="pointer" onClick={removeThumbnail}>
                                        <AiOutlineClose className="a-th-icon txt-white" />
                                    </span>}
                                </div>
                            </div>}
                            <div className="cncf-field">
                                <label className="txt-white">Asset Attributes</label>
                                <div className="cncf-atr">
                                    <div className="cncf-atr-btn pointer" onClick={() => setModal("attributes")}>
                                        <MdEdit className="cnab-icon txt-white" />
                                    </div>
                                    <div className="cnab-atr txt-white">
                                        {
                                            attributes ?
                                            formatAttributes
                                            : 
                                            `E.g Background: Blue 12%; Hair: Black %; Face: Brown 3%; Mouth: Flat 10%`
                                        }
                                    </div>
                                </div>
                            </div>
                            <button className="cncf-submit-btn pointer" type="submit">
                                <BsSend className="csb-icon" />
                                <span>{loading ? "Submiting..." : "Submit"}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {modal === "gallery" && <CreateGallery closeModal={() => setModal("")} 
            successFn={() => {
                setModal("success");
                fetchUserGalleries();
            }} />}

            {modal === "attributes" && <AttributesSelector closeModal={(res) => {
                setAttributes(res);
                setModal("");
            }} />}

            {modal === "success" && <SuccessModal text={"NFT created succesfully."}
                closeModal={() => {
                    setModal("");
                    navigate(key ? -1 : "/app/create");
                }} 
            />}

        </div>
    )
};

export default CreateNFT;