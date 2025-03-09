import { useEffect, useRef, useState } from "react";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { THIRD_WEB_ID } from "./config";

const Test = () => {

    const [file, setFile] = useState({});
    const [url, setUrl] = useState("");
    const audioRef = useRef();

    function handleChange(e) {
        const File_ = e.target.files[0];
        console.log("file_type", File_.type);
        setFile(File_);
    };

    const sendFileBuf = async (fileBuf) => {
        const storage = new ThirdwebStorage({
            clientId: THIRD_WEB_ID
        });
        const uri = await storage.upload(fileBuf);
        const url_ = storage.resolveScheme(uri);
        console.log(url_);
        setUrl(url_);
    };

    const handleSub = async () => {
        try {
            sendFileBuf(file);
        } catch(err) {
            console.log(err, err.message);
        }
    };

    // const audio = "https://805e32eeef8d79912f079b3ac853e1f3.ipfscdn.io/ipfs/bafybeihio4yubjlru4cdra64qsvfafgcea2pfrmf7zw7adswkasvap6lku/file_example_MP3_700KB.mp3";
    // const gif = "https://805e32eeef8d79912f079b3ac853e1f3.ipfscdn.io/ipfs/bafybeiaspabnv6nx35k4sp4rfdnabxlehqgcdlrs3ofup44tb6r4wskot4/SampleGIFImage_350kbmb.gif";

    return (
        <div>
            {url && <img src={url} alt="" />}
            {/* {url && <audio ref={audioRef} controls>
                <source src={url} type="audio/mp3" />
            </audio>} */}
            <input type="file" onChange={handleChange} />
            <button onClick={handleSub}>Submit</button>
        </div>
    );
};

export default Test;
