import { divideBigDecimals, multiplyBigDecimals, subtractBigDecimals } from "./services/creators";
import avatar from "./assets/avatar.png";

export const AVATAR_PIC = avatar;

export const getPeriod = (secs) => {
    secs -= 0;
    const d = new Date().getTime() / 1000;
    const diff = Math.abs(secs - d);
    const yr = 946080000;
    if(diff >= yr) return `${parseAmount(divideBigDecimals(diff, yr, 2))}yr(s)`;
    else if(diff >= 2592000) return `${divideBigDecimals(diff, 2592000, 2)}mo(s)`;
    else if(diff >= 86400) return `${Math.floor(diff / 86400)}day(s)`;
    else if(diff >= 3600) return `${Math.floor(diff / 3600)}hr(s)`;
    else if(diff >= 60) return `${Math.floor(diff / 60)}min(s)`;
    else return `${Math.floor(diff)}sec(s)`;
};

export const compareVals = (n1, n2, metrics) => {
    if(metrics === ">") return subtractBigDecimals(n1, n2) > 0;
    else if(metrics === "<") return subtractBigDecimals(n1, n2) < 0;
    else if(metrics === ">=") return subtractBigDecimals(n1, n2) >= 0;
    else if(metrics === "<=") return subtractBigDecimals(n1, n2) <= 0;
    else return "";
};

export const percentDiff = (val, tar) => {
    return (((val - tar) / tar) * 100).toFixed(2);
};

export const isSameDay = (date, refDate) => {
    date = new Date(date);
    refDate = new Date(refDate);
    if(date.getMonth() === refDate.getMonth() && date.getFullYear() === refDate.getFullYear()) {
        return date.getDate() === refDate.getDate();
    } else return false;
};

export const getDateWithoutTime = (date, x = 0) => {
    if(x) date = String(multiplyBigDecimals(String(date), 1000));
    date = String(new Date(Number(date)));
    return date.slice(4, 15);
};

export const Z_ = (z) => {
    return z > 9 ? z : "0"+z;
};

export const getTime = (date, x = 0) => {
    if(x) date = String(multiplyBigDecimals(String(date), 1000));
    date = new Date(Number(date));
    const hr = date.getHours();
    let m = "AM";
    if(hr >= 12) m = "PM";
    return `${Z_(hr)}:${Z_(date.getMinutes())} ${m}`;
}

export const getFullDateWithTime = (date, x = 0) => {
    return getDateWithoutTime(date, x) + " at " + getTime(date, x);
};

export const parseAmount = (amt) => {
    if(amt < 1E9) amt = Number(amt);

    if(amt > 1E9) return divideBigDecimals(amt, 1E9, 2) + " B";
    if(amt > 1E6) return (amt / 1E6).toFixed(2) + " M";
    else if(amt > 9999) return (amt / 1000).toFixed(2) + " K";
    else return amt;
};

export const getDistribution = async (data, fn) => {
    const mx = Math.max(...data);
    return [
        0.05 * mx,
        0.25 * mx,
        0.50 * mx,
        0.75 * mx,
        mx
    ]
};

export const getDateWithOnlyMonth = (date) => {
    return String(new Date(Number(date))).slice(4, 10);
}; 

export const inProduction = (val, type = "gallery") => {
    return 0;
};

export const parseStringData = (data, argFn = null) => {
    const res = {};
    const spls = data.split('%x2');
    for(let spl of spls) {
        const [key, value] = spl.split('=');
        if(!key) continue;
        else if(argFn) res[key] = argFn(key, value);
        else res[key] = (value||'').replaceAll('%x3', '\n');
    }
    return res;
};

export const parseGalleryData = (val, dec = 10000000000) => {
    const [owner, name, meta_data, attendees, createdAt, price, votingEnd, votingStart, minStakingAmount] = [
        val[0], val[1], val[2], ...val.slice(3).map(v => String(v))
    ];
    const metadata = parseStringData(meta_data);
    return {
        owner, name, metadata, attendees, createdAt, 
        price: divideBigDecimals(Number(price), dec), 
        votingEnd, votingStart, 
        minStakingAmount: divideBigDecimals(Number(minStakingAmount), dec)
    };
};

const parseAttributeData = (atr) => {
    const res = [];
    const spls = atr.split('%x4');
    for(let spl of spls) {
        const [key, value] = spl.split('->');
        if(!key) continue;
        else res.push([ key, value ]);
    }
    return res;
};

export const parseNftMetaData = (data) => {
    const [ creator, meta_data, gallery_id ] = data;
    const md = meta_data.replaceAll(":=", ":->");

    const m = parseStringData(md, (key, value) => {
        if(key === "attributes") return parseAttributeData(value);
        else return (value||'').replaceAll('%x3', '\n');
    });

    // no need to divide price here cus gallery data used in creating nft
    // already has divided price
    
    return { creator, gallery_id: String(gallery_id), metadata: m };
};

export const setMessageFn = (fn, text) => {
    fn(text);
    setTimeout(() => fn({}), 2000);
};

export const valDiff = (val, tar) => {
    return (val - tar).toFixed(4);
};

export const clx = (diff_val) => {
    if(diff_val > 0) return 'txt-positive';
    else if(diff_val == 0) return 'txt-neutral';
    else return 'txt-negative';
};

export const shortenAddy = (addy) => {
    return addy.slice(0, 6) + '...' + addy.slice(-4);
};

export const formatDate = (date) => {
    date = date - 0;
    return String(new Date(date)).slice(4, 16);
};

export const getVideoImage = async (video_url) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.src = video_url;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = () => {
            video.currentTime = 0.3;
        };

        video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
        };

        video.onerror = () => reject("Error loading video");
    });
};

export const getTooltipPosition = (tooltipWidth, tooltipHeight, targetElement) => {
    const { left, right, top, bottom, width } = targetElement;
    const { innerWidth } = window;
    const diff = (0.5 * tooltipWidth) - (0.5 * width);
    const top_space = 40;
    let res_left = 0, changed = false, res_top = top - tooltipHeight - top_space;

    if(res_top <= 5) {
        res_top = bottom + 12;
        changed = true;
    }

    if(diff > 0) {
        const right_bound = innerWidth - 33 - right - diff;
        if(right_bound <= 0) {
            res_left = left - diff + right_bound;
        } else if (left - diff <= 6) {
            res_left = 10;
        } else {
            res_left = left - diff;
        }    
    } else {
        res_left = left + Math.abs(diff);
    }

    return {
        left: res_left + "px",
        top: res_top + "px",
        alignment: changed ? "bottom" : "top",
        arrow: ((left + (0.5 * width)) - res_left - 6) + "px",
    }
};