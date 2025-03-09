import axios from 'axios';
import { SERVER_URL, THIRD_WEB_ID } from '../config';
import { ThirdwebStorage } from "@thirdweb-dev/storage";

export const sendFile = async (data) => {
    // const url = `${SERVER_URL}/upload-ipfs`;
    // return axios.post(url, data);

    const storage = new ThirdwebStorage({
        clientId: THIRD_WEB_ID
    });
    const uri = await storage.upload(data, {
        onProgress: undefined,
    });
    const url_ = storage.resolveScheme(uri);
    return url_;
};

export const sendProfileFile = (data) => {
    const url = `${SERVER_URL}/upload_users_file`;
    return axios.post(url, data);
};