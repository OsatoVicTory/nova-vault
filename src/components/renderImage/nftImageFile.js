import "./images.css";
import defaultAudioThumbnail from "../../assets/musicdefaultThnumbnail.jpg";
import { BsMusicNoteBeamed } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import { getVideoImage } from "../../utils";
import { Skeleton } from "../loading";
import { IoMdVideocam } from "react-icons/io";

const AudioNftFileImage = ({ data }) => {

    const [duration, setDuration] = useState(0);
    const audio = useRef();

    const getDuration = () => {
        const zeros = (val) => val >= 10 ? val : '0'+val;
        const dur_ = audio.current.duration;
        const min = Math.floor(dur_ / 60);
        const sec = Math.floor(dur_ % 60);
        const dur = `${zeros(min)}:${zeros(sec)}`;
        setDuration(dur);
    };

    useEffect(() => {
        audio.current = new Audio();
        audio.current.src = data.src;

        audio.current.addEventListener("loadedmetadata", getDuration);

        return () => audio.current.removeEventListener("loadedmetadata", getDuration);
    }, []);

    return (
        <div className="NftFileImage">
            <img src={data.thumbnail || defaultAudioThumbnail} alt="thumbnail" />
            <div className="nft-file-image-div">
                <BsMusicNoteBeamed className="nfid-icon" />
                <span>{duration === 0 ? "00:00" : duration}</span>
            </div>
        </div>
    );
};

const VideoNftFileImage = ({ data }) => {

    const [thumbnail, setThumbnail] = useState(data.thumbnail);
    const [duration, setDuration] = useState(0);
    const video = useRef();

    const getDuration = () => {
        const zeros = (val) => val >= 10 ? val : '0'+val;
        const dur_ = video.current.duration;
        const min = Math.floor(dur_ / 60);
        const sec = Math.floor(dur_ % 60);
        const dur = `${zeros(min)}:${zeros(sec)}`;
        setDuration(dur);
    };
    
    const getVideoImageUrl = async () => {
        try {
            const url = await getVideoImage(data.src);
            setThumbnail(url);
        } catch(err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if(!thumbnail) getVideoImageUrl();
        video.current = document.createElement("video");
        video.current.src = data.src;

        video.current.addEventListener("loadedmetadata", getDuration);

        return () => video.current.removeEventListener("loadedmetadata", getDuration);
    }, [thumbnail]);

    return (
        <div className="NftFileImage">
            {
                !thumbnail ?
                <div className={`w-full h-full`}><Skeleton /></div>
                :
                <img src={thumbnail} alt="thumbnail" />
            }
            <div className="nft-file-image-div">
                <IoMdVideocam className="nfid-icon" />
                <span>{duration === 0 ? "00:00" : duration}</span>
            </div>
        </div>
    );
};


const NftImageFile = ({ data }) => {

    return (
        <>
        {
            data.file_type === "audio" ?
            <AudioNftFileImage data={data} />
            :
            <VideoNftFileImage data={data} />
        }
        </>
    );
};

export default NftImageFile;