import { LazyLoadImage } from "react-lazy-load-image-component"
import useGetToolTip from "../../hooks/useGetToolTip";
import { useMemo, useRef } from "react";
import { parseAmount, parseIpfsUrl } from "../../utils";

const HomeList = ({ val, shortenAddy_, scrollPosition }) => {

    const nameRef = useRef();
    const ownerRef = useRef();
    
    useGetToolTip(nameRef, val.name, []);
    
    useGetToolTip(ownerRef, val.owner, []);
    
    const parseAttendees_ = useMemo(() => {
        return val.attendees ? parseAmount(val.attendees) : "0";
    }, [val.attendees]);

    return (
        <div className='gml'>
            <LazyLoadImage 
                src={parseIpfsUrl(val.metadata.img)} alt={val.name}
                width={"100%"} height={"180px"}
                scrollPosition={scrollPosition}
                placeholder={<div className={`op-img-placeholder`}></div>}
            />
            <div className='gml-txt'>
                <span className='txt-white' ref={nameRef}>{val.name}</span>
                <div className='gmlt-base'>
                    <div>
                        <span className='gmltb-type txt-white'>Creator</span>
                        <span className='gmltb-value txt-white' ref={ownerRef}>
                            {shortenAddy_(val.owner)}
                        </span>
                    </div>
                    <div>
                        <span className='gmltb-type txt-white'>Attendees</span>
                        <span className='gmltb-value txt-white flex-end'>{parseAttendees_}</span>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default HomeList;