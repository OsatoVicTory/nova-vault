import { LazyLoadImage } from "react-lazy-load-image-component";
import "./images.css";
import { Skeleton } from "../loading";
import { useCallback, useMemo, useRef } from "react";
import useGetToolTip from "../../hooks/useGetToolTip";
import { getFullDateWithTime, parseIpfsUrl } from "../../utils";
import NftImageFile from "./nftImageFile";
// import { calcHeight } from "../../utils";

export const NFTGridImage = ({ nft, loading, scrollPosition, isGallery, hasPrice }) => {

    const hovRef = useRef();
    const addressRef = useRef();
    
    useGetToolTip(hovRef, nft?.name || nft?.metadata?.name, [loading]);

    useGetToolTip(addressRef, nft?.creator||nft?.metadata?.price||"", [loading]);

    const shortner = useCallback((addy) => {
        return addy.slice(0, 7) + "..." + addy.slice(-6);
    }, []);

    return (
        <div className="NFTGridImage w-full">
            <div className="nft-g-abs">
                <div className="nft-g-image">
                    {
                        loading ?
                        <div className="nft-g-image-loading">
                            <Skeleton />
                        </div>
                        :
                        (
                            (nft?.metadata?.src && nft?.metadata?.file_type !== "image") ?
                            <NftImageFile data={nft.metadata} />
                            :
                            (
                                scrollPosition === null ?
                                <LazyLoadImage 
                                    src={parseIpfsUrl(nft.metadata.img)} alt={nft.name || nft.metadata.name}
                                    width={"100%"} height={"100%"}
                                    placeholder={<div className={`op-img-placeholder`}></div>}
                                /> :
                                <LazyLoadImage 
                                    src={parseIpfsUrl(nft.metadata.img)} alt={nft.name || nft.metadata.name}
                                    width={"100%"} height={"100%"}
                                    scrollPosition={scrollPosition}
                                    placeholder={<div className={`op-img-placeholder`}></div>}
                                />
                            )
                        )
                    }
                </div>
                {/* <div className={`nft-g-image-cloak ${loading}`}></div> */}
            </div>

            {!loading && <div className="nft-g-image-txt">
                <span className="ngit1" ref={hovRef}>
                    {nft?.name || nft.metadata.name}
                </span>
                {
                    isGallery ? 
                    <span className="ngit2 no-ref">{`Attendees: ${nft.attendees}`}</span>
                    :
                    (
                        hasPrice ?
                        <span className="ngit2 no-ref">{`Price: ${nft?.price || nft.metadata.price} NOVA`}</span>
                        :
                        <span className="ngit2 ref" ref={addressRef}>{`Creator: ${shortner(nft.creator)}`}</span>
                    )
                }
            </div>}

            {loading && <div className="nft-g-image-txt loading">
                <div className="ngit1"><Skeleton /></div>
                <div className="ngit2"><Skeleton /></div>
            </div>}
        </div>
    );
};

export const NFTFlexImage = ({ index, nft, loading, scrollPosition, clx }) => {

    const hovRef = useRef();
    
    useGetToolTip(hovRef, nft?.name || nft?.metadata?.name, [loading]);

    const shortner = useCallback((addy) => {
        return addy.slice(0, 7) + "..." + addy.slice(-6);
    }, []);

    const date_ = useMemo(() => {
        return getFullDateWithTime(nft?.metadata?.createdAt || new Date("19 Feb 2025").getTime());
        // if(nft.metadata.createdAt) return getFullDateWithTime(nft.metadata.createdAt);
        // else return "";
    }, [nft?.metadata?.createdAt]);

    return (
        <div className="NFTFlexImage w-full">
            {!loading && <div className={`${clx} w-full`}>
                <span className="nft-f-txt t# txt-white">{index + 1}</span>
                <div className="nft-f-image">
                    <div className="nft-f-img">
                        {
                            (nft?.metadata?.src && nft?.metadata?.file_type !== "image") ?
                            <NftImageFile data={nft.metadata} />
                            :
                            <LazyLoadImage 
                                src={parseIpfsUrl(nft.metadata.img)} alt={nft.name || nft.metadata?.name}
                                width={"100%"} height={"100%"}
                                scrollPosition={scrollPosition}
                                placeholder={<div className={`op-img-placeholder`}></div>}
                            />
                        }
                    </div>
                    <span className="nft-f-txt nft-name txt-white" ref={hovRef}>{nft.name || nft.metadata.name}</span>
                </div>
                {/* <span className="nft-f-txt nftf-amount txt-white">
                    {nft.price || nft.metadata.price} <div className="nftf-token-symbol txt-white">NOVA</div>
                </span> */}
                <span className="nft-f-txt txt-white">{shortner(nft.creator)}</span>
                <span className="nft-f-txt txt-white">{date_}</span>
            </div>}
            
            {loading && <div className={`${clx} nft-f-loading w-full`}>
                <div className="nft-f-txt t# span"><Skeleton /></div>
                <div className="nft-f-image">
                    <div className="nft-f-img"><Skeleton /></div>
                    <div className="nft-txt nft-name span"><Skeleton /></div>
                </div>
                {/* <div className="nft-f-txt nftf-amount span"><Skeleton /></div> */}
                <div className="nft-f-txt span"><Skeleton /></div>
                <div className="nft-f-txt span"><Skeleton /></div>
            </div>}
        </div>
    );
};

// export const NFTGalleryImage = ({ index, nft, loading, scrollPosition }) => {

//     const hovRef = useRef();
//     const text = `${nft.name} \nPrice: ${nft.price} $NOVA`;
    
//     useGetToolTip(hovRef, text, loading); 

//     const height = useMemo(() => calcHeight(index), []);

//     return (
//         <div className="NFTGallerImage w-full">
//             <div className="nft-g-abs">
//                 <div className="nft-g-image" ref={hovRef}>
//                     <LazyLoadImage 
//                         src={nft.url} alt={nft.name}
//                         width={"100%"} height={height}
//                         scrollPosition={scrollPosition}
//                         placeholder={<div className={`op-img-placeholder`}></div>}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };