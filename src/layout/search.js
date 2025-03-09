import { useCallback, useContext, useEffect, useState } from "react";
import "./search.css";
import { createGalleryContractInstance, parseBigInt } from "../services/creators";
import { inProduction, parseAmount, parseGalleryData } from "../utils";
import ErrorPage from "../components/error";
import { LoadingSpinner } from "../components/loading";
import NoData from "../components/noData";
import { Link } from "react-router-dom";
import { AppContext } from "../context";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Search = ({ search }) => {

    const { contract, galleries, setGalleries, sessions, setSessions } = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchRes, setSearchRes] = useState([]);

    const fetchSearch = async () => {
        setError(false);
        if(sessions.loaded) {
            setSearchRes(galleries.filter(d_ => d_.name.toLowerCase().includes(search.toLowerCase())));
            setLoading(false); 
            return;
        }
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
            setSearchRes(data.filter(d_ => d_.name.toLowerCase().includes(search.toLowerCase())));
            setLoading(false); 
        } catch (err) {
            console.log(err);
            setError(true);
            setLoading(false); 
        }
    };

    useEffect(() => {
        if(search) fetchSearch();
    }, [search]);

    const shortenAddy_ = useCallback((addy) => {
        return addy.slice(0, 6) + "..." + addy.slice(-5);
    }, [loading]);
        
    const parseAttendees_ = useCallback((val) => {
        return val.attendees ? parseAmount(val.attendees) : "0";
    }, [loading]);

    return (
        <div className="app-search">
            {
                error ?
                <div className="app-search-divs">
                    <ErrorPage fireFn={fetchSearch} />
                </div>
                :
                (
                    loading ?
                    <div className="app-search-divs">
                        <LoadingSpinner width={"42px"} height={"42px"} />
                    </div>
                    :
                    <div className="app-search-main w-full">
                        {
                            searchRes.length === 0 ?
                            <div className="app-search-divs">
                                <NoData text={"No result matching with Search."} />
                            </div>
                            :
                            <ul>
                                {searchRes.map((val, idx) => (
                                    <li key={`ap-search-${idx}`} className="app-search-li">
                                        <Link to={`/app/${val.gallery_id}`} className="asl-link w-full">
                                            <div className="asll-div">
                                                <div className="aslld-img">
                                                    <LazyLoadImage 
                                                        src={val.metadata.img} alt={val.name}
                                                        width={"100%"} height={"100%"}
                                                        placeholder={<div className={`op-img-placeholder`}></div>}
                                                    />
                                                </div>
                                                <div className="aslld-txt">
                                                    <span className="aslld-gallery-name txt-white">{val.name}</span>
                                                    <div className="aslld-txt-base">
                                                        <span className="txt-white">Owner: {shortenAddy_(val.owner)}</span>
                                                        <span className="txt-white">Attendees: {parseAttendees_(val.attendees)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        }
                    </div>
                )
            }
        </div>
    );
};

export default Search;