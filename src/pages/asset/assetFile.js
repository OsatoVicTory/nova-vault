import { useEffect, useMemo, useRef, useState } from "react";
import defaultAudioThumbnail from "../../assets/musicdefaultThnumbnail.jpg";
import "./assetFile.css";
import { IoPauseSharp } from "react-icons/io5";
import { IoMdPlay } from "react-icons/io";
import { getVideoImage, parseIpfsUrl } from "../../utils";
import { Skeleton } from "../../components/loading";

export const AudioFile = ({ data }) => {

    const audio = useRef();
    const inputRef = useRef();
    const [state, setState] = useState('');
    const [playingTime, setPlayingTime] = useState(0);
    const [duration, setDuration] = useState(0);

    function slided(e) {
        const value = inputRef.current.value;
        inputRef.current.style.backgroundSize = value + "% 105%";
        const seekto = audio.current.duration * (value / 100);
        audio.current.currentTime = seekto;
    };

    const updateTime = () => {
        const curTime = Math.floor(audio.current.currentTime);
        setPlayingTime(curTime);
        const val = (curTime / audio.current.duration) * 100;
        inputRef.current.value = val;
        inputRef.current.style.backgroundSize = val + "% 105%";
    };

    const getDuration = () => {
        const zeros = (val) => val >= 10 ? val : '0'+val;
        const dur_ = audio.current.duration;
        const min = Math.floor(dur_ / 60);
        const sec = Math.floor(dur_ % 60);
        const dur = `${zeros(min)}:${zeros(sec)}`;
        setDuration(dur);
    };

    useEffect(() => {
        const inp = inputRef.current;
        if(inp) {
            inputRef.current.value = 0;
            inp.addEventListener('input', slided);
        }

        if(audio.current) {
            audio.current.addEventListener("loadedmetadata", getDuration);
            // audio.current.src = data.src;
        }

        return () => {
            inp && inp.removeEventListener('input', slided);
            if(audio.current) audio.current.removeEventListener("loadedmetadata", getDuration);
        }
    }, []);
    
    useEffect(() => {
        const aud = audio.current;
        
        if(state === 'playing' && aud) aud.addEventListener('timeupdate', updateTime);
        return () => aud && aud.removeEventListener('timeupdate', updateTime);
    }, [state]);

    const formatTime = useMemo(() => {
        const zeros = (val) => val >= 10 ? val : '0'+val;
        const min = Math.floor(playingTime / 60);
        const sec = Math.floor(playingTime % 60);
        const r_ = `${zeros(min)}:${zeros(sec)}`;
        if(r_ === duration) setState("paused");
        return r_;
    }, [playingTime, duration]);

    const togglePlay = () => {
        if(state === 'playing') {
            if(audio.current) audio.current.pause(); 
            setState('paused');
        }
        if(state !== 'playing') {
            if(audio.current) audio.current.play(); 
            setState('playing');
        }
    };

    return (
        <div className="asset-audio-file">
            <div className="asset-audio-file-thumbnail">
                <img src={data.thumbnail ? parseIpfsUrl(data.thumbnail) : defaultAudioThumbnail} alt="thumbnail" />
            </div>
            <div className="asset-audio-file-base">
                <div className='player-controls w-full'>
                    <input type='range' min={'0'} max={'100'} className='slider-file' ref={inputRef} />
                    <audio style={{display: 'none'}} ref={audio} width={'100%'} height={'100%'}>
                        <source src={data.src} type="video/mp4" />
                    </audio>
                    <div className='music-durations'>
                        <span className="white">{formatTime}</span>
                        <button className='ctrl-btn pointer pause-play' onClick={() => togglePlay()}>
                            {state === 'playing' && <IoPauseSharp className='pp-icon txt-white' />}
                            {state !== 'playing' && <IoMdPlay className='pp-icon txt-white' />}
                        </button>
                        <span className="white">{duration === 0 ? "00:00" : duration}</span>
                    </div>
                </div>
            </div>
        </div>
    )
};

export const VideoFile = ({ data }) => {

    const video = useRef();
    const inputRef = useRef();
    const [state, setState] = useState('');
    const [playingTime, setPlayingTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [thumbnail, setThumbnail] = useState(data.thumbnail ? parseIpfsUrl(data.thumbnail) : "");
    const [played, setPlayed] = useState(false);

    function slided(e) {
        const value = inputRef.current.value;
        inputRef.current.style.backgroundSize = value + "% 105%";
        const seekto = video.current.duration * (value / 100);
        video.current.currentTime = seekto;
    };

    const updateTime = () => {
        const curTime = Math.floor(video.current.currentTime);
        setPlayingTime(curTime);
        const val = (curTime / video.current.duration) * 100;
        inputRef.current.value = val;
        inputRef.current.style.backgroundSize = val + "% 105%";
    };

    const getVideoImageUrl = async () => {
        try {
            const url = await getVideoImage(data.src);
            setThumbnail(url);
        } catch(err) {
            console.log(err);
        }
    };

    const getDuration = () => {
        const zeros = (val) => val >= 10 ? val : '0'+val;
        const dur_ = video.current.duration;
        const min = Math.floor(dur_ / 60);
        const sec = Math.floor(dur_ % 60);
        const dur = `${zeros(min)}:${zeros(sec)}`;
        setDuration(dur);
    };

    useEffect(() => {
        if(!thumbnail) getVideoImageUrl();

        const inp = inputRef.current;
        if(inp) {
            inputRef.current.value = 0;
            inp.addEventListener('input', slided);
        }

        if(video.current) {
            video.current.addEventListener("loadedmetadata", getDuration);
            // video.current.src = data.src;
        }

        return () => {
            inp && inp.removeEventListener('input', slided);
            if(video.current) video.current.removeEventListener("loadedmetadata", getDuration);
        }
    }, [thumbnail]);
    
    useEffect(() => {
        const vid = video.current;
        
        if(state === 'playing' && vid) vid.addEventListener('timeupdate', updateTime);
        return () => vid && vid.removeEventListener('timeupdate', updateTime);
    }, [state]);

    const formatTime = useMemo(() => {
        const zeros = (val) => val >= 10 ? val : '0'+val;
        const min = Math.floor(playingTime / 60);
        const sec = Math.floor(playingTime % 60);
        const r_ = `${zeros(min)}:${zeros(sec)}`;
        if(r_ === duration) setState("paused");
        return r_;
    }, [playingTime, duration]);

    const togglePlay = () => {
        if(state === 'playing') {
            if(video.current) video.current.pause(); 
            setState('paused');
        }
        if(state !== 'playing') {
            setPlayed(true);
            if(video.current) video.current.play(); 
            setState('playing');
        }
    };

    return (
        <div className={`asset-audio-file ${played}`}>
            <div className="asset-audio-file-thumbnail">
                {
                    !thumbnail ?
                    <Skeleton />
                    :
                    <img src={thumbnail} alt="thumbnail" />
                }
            </div>
            <video ref={video} width={'100%'} height={'100%'}>
                <source src={data.src} type="video/mp4" />
            </video>
            <div className="asset-audio-file-base">
                <div className='player-controls w-full'>
                    <input type='range' min={'0'} max={'100'} className='slider-file' ref={inputRef} />
                    <div className='music-durations'>
                        <span className="white">{formatTime}</span>
                        <button className='ctrl-btn pointer pause-play' onClick={() => togglePlay()}>
                            {state === 'playing' && <IoPauseSharp className='pp-icon txt-white' />}
                            {state !== 'playing' && <IoMdPlay className='pp-icon txt-white' />}
                        </button>
                        <span className="white">{duration === 0 ? "00:00" : duration}</span>
                    </div>
                </div>
            </div>
        </div>
    )
};

export const AssetFile = ({ data }) => {
    return (
        <>
            {
                data.file_type === "audio" 
                ?
                <AudioFile data={data} />
                :
                <VideoFile data={data} />
            }
        </>
    );
};