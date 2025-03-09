import './home.css';
import { BsPlusSquare } from 'react-icons/bs';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FaCheck } from 'react-icons/fa6';
import { AppContext } from '../../context';
import { Skeleton } from '../../components/loading';
// import img_ from "../../assets/nft_1.png";
import NoData from '../../components/noData';
import ErrorPage from '../../components/error';
import { createGalleryContractInstance, parseBigInt } from '../../services/creators';
import { inProduction, parseGalleryData, setMessageFn } from '../../utils';
import HomeList from './list';

const Galleries = () => {

    const navigate = useNavigate();
    const { contract, scrollPosition, galleries, setGalleries, setSessions, setMessage } = useContext(AppContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState("All Galleries");
    const skeletons = Array(9).fill(0);

    const fetchGalleries = async () => {
        setError(false);
        setLoading(true);
        
        try {
            const contractInstance = await createGalleryContractInstance(contract.signer);
            const lst = ((await contractInstance.getLastIndex()) + "") - 0;
            const lstBadIndex = inProduction("", "gallery") || 0;
            const data = await Promise.all(
                Array(lst - lstBadIndex).fill(0).map((v, i) => {
                    const gallery_id = parseBigInt(lstBadIndex + i + 1);
                    return contractInstance.getGallery(gallery_id).then(res => {
                        return { ...parseGalleryData(res), gallery_id: String(gallery_id) };
                    })
                })
            );
            setGalleries(data);
            setSessions({ loaded: true });
            setLoading(false); 
        } catch (err) {
            console.log(err);
            setError(true);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Network error. Try again.' }); 
        }
    };

    useEffect(() => {
        fetchGalleries();
    }, []);

    const shortenAddy_ = useCallback((addy) => {
        return addy.slice(0, 5) + "..." + addy.slice(-4);
    }, [loading]);

    const createFn = useCallback((e) => {
        navigate(`/app/create/gallery`);
    }, []);

    const displayableData = useMemo(() => {
        if(loading) return skeletons;
        else if(query === "All Galleries") return galleries;
        else if(query === "Trending Galleries") { // more attendees means it has more popularity and likes
            return [...galleries].sort((a, b) => {
                const a_ = Number(a.attendees);
                const b_ = Number(b.attendees);
                return b_ > a_ ? 1 : b_ < a_ ? -1 : 0
            });
        } else { // most recent is highest time in createdAt
            return [...galleries].sort((a, b) => {
                const a_ = Number(a.createdAt);
                const b_ = Number(b.createdAt);
                return b_ > a_ ? 1 : b_ < a_ ? -1 : 0
            });
        }
    }, [loading, query, galleries.length]);

    return (
        <div className='Galleries w-full'>
            <div className='galleries-wrapper w-full'>
                <div className='galleries-header w-full'>
                    <div className='g-header w-full'>
                        <h3 className='txt-white'>Explore all Galleries</h3>
                        <div>
                            <div className="options-div">
                                <button className={`option-btn ${!loading && "pointer"}`} onClick={() => !loading && setShowDropdown(!showDropdown)}>
                                    <span className='txt-white'>{query}</span>
                                    <MdKeyboardArrowDown className={`ob-icon ${showDropdown} txt-white`} />
                                </button>
                                {showDropdown && <div className={`option-dropdown ${showDropdown}`}>
                                    <div className='od-options pointer' onClick={() => setQuery("All Galleries")}>
                                        <FaCheck className={`odp-icon ${query === "All Galleries"}`} />
                                        <span className='txt-white'>All Galleries</span>
                                    </div>
                                    <div className='od-options pointer' onClick={() => setQuery("Trending Galleries")}>
                                        <FaCheck className={`odp-icon ${query === "Trending Galleries"}`} />
                                        <span className='txt-white'>Trending Galleries</span>
                                    </div>
                                    <div className='od-options pointer' onClick={() => setQuery("Recent Galleries")}>
                                        <FaCheck className={`odp-icon ${query === "Recent Galleries"}`} />
                                        <span className='txt-white'>Recent Galleries</span>
                                    </div>
                                </div>}
                            </div>
                            {!loading && <button className='create-gallery-btn pointer' onClick={createFn}>
                                <BsPlusSquare className='cgb-icon' />
                                <span>Create Gallery</span>
                            </button>}
                            {loading && <div className='create-gallery-loading'>
                                <Skeleton />
                            </div>}
                        </div>
                    </div>
                </div>
                <div className='galleries-main w-full'>

                    {error && <div className='g-main w-full'>
                        <ErrorPage fireFn={fetchGalleries} />
                    </div>}

                    {!error && <div className='g-main w-full'>

                        {(galleries.length === 0 && !loading) && <div className='w-full'>
                            <NoData 
                                text={"No Galleries created.\n Click button below to create one now."}
                                btnTxt={"Create now"}
                                btnFn={createFn}
                            />
                        </div>}

                        {(galleries.length > 0 || loading) && <ul className='gm-ul'>
                            {displayableData.map((val, idx) => (
                                <li key={`gm-li-${idx}`} className='gm-li w-full'>

                                    {!loading && <Link to={{
                                        pathname: `/app/gallery/${val.gallery_id}`,
                                        state: { galleryData: val }
                                     }} className='gml-link w-full'>
                                        <HomeList val={val} shortenAddy_={shortenAddy_} scrollPosition={scrollPosition} />
                                    </Link>}

                                    {loading && <div className='gml-link w-full'>
                                        <div className='gml'>
                                            <div className='gml-img-loading'><Skeleton /></div>
                                            <div className='gml-txt'>
                                                <span className='loading'><Skeleton /></span>
                                                <div className='gmlt-base'>
                                                    <div>
                                                        <span className='gmltb-type loading'><Skeleton /></span>
                                                        <span className='gmltb-value loading'><Skeleton /></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>}

                                </li>
                            ))}
                        </ul>}
                    </div>}
                </div>
            </div>
        </div>
    )
};

export default Galleries;