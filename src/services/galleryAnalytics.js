import { Contract } from "ethers";
import { compareVals, getDateWithOnlyMonth, getDistribution, shortenAddy } from "../utils";
import { 
    addBigDecimals, divideBigDecimals, GALLERY_ADDRESS, 
    multiplyBigDecimals, NFT_LIBRARY_ADDRESS, parseBigInt, subtractBigDecimals, 
    TICKET_SALE_ADDRESS 
} from "./creators";

export const DAY_TIME = 24 * 60 * 60 * 1000;

export const isSameDay_ = (cur, ref) => {
    cur = new Date(Number(String(cur)));
    ref = new Date(Number(String(ref)));
    if(cur.getFullYear() !== ref.getFullYear()) return false;
    else if(cur.getMonth() !== ref.getMonth()) return false;
    return cur.getDate() === ref.getDate();
};

export const getDaysCount = (date) => {
    date = String(new Date(Number(String(date)))).slice(4, 16);
    date = new Date(date).getTime();
    const cur = new Date().getTime();
    return String(divideBigDecimals(subtractBigDecimals(cur, date), DAY_TIME));
};

export const is24Hr = (date) => {
    const t = new Date().getTime();
    date = new Date(Number(String(date))).getTime();
    return compareVals(subtractBigDecimals(t, date), 24 * 60 * 60 * 1000, "<="); 
};

export const getGalleryAttendeesCntForHomePage = async (signer, g_id) => {
    try {
        const gallery_id = parseBigInt(g_id);
        const ADDRESS = GALLERY_ADDRESS;
        const abi = [
            "event JoinedGallery(uint256 indexed gallery_index, address indexed member, uint64 time)"
        ];
        const newContract = new Contract(ADDRESS, abi, signer);
        const filter = newContract.filters.JoinedGallery(gallery_id, null);
        const data = await newContract.queryFilter(filter);
        data.reverse(); // so we have data from most recent
        let i = data.length - 1, cnt = 0;
        while(i >= 0 && is24Hr(multiplyBigDecimals(data[i].args[2], 1000))) {
            cnt++;
            i--;
        }
        return { change: cnt, len: data.length };
    } catch (err) {
        throw new Error(err);
    }
};


export const getGalleryAttendees = async (signer, g_id) => {
    try {
        const gallery_id = parseBigInt(g_id);
        const ADDRESS = GALLERY_ADDRESS;
        const abi = [
            "event JoinedGallery(uint256 indexed gallery_index, address indexed member, uint64 time)"
        ];
        const newContract = new Contract(ADDRESS, abi, signer);
        const filter = newContract.filters.JoinedGallery(gallery_id, null);
        const data = await newContract.queryFilter(filter);
        const res = [];

        for(let i = 0; i < data.length; i++) {
            const [gallery_index, address, date] = data[i].args;
            res.push({ gallery_index, address, date: multiplyBigDecimals(date, 1000) });
        };
        return res;
    } catch (err) {
        throw new Error(err);
    }
};

export const getGalleryAttendeesPrices = async (signer, seller, g_id, range = 20) => {
    const gallery_id = parseBigInt(g_id);
    try {
        const ADDRESS = TICKET_SALE_ADDRESS;
        const abi = [
            "event SoldTicket(address indexed seller, uint256 indexed gallery_index, uint256 price, uint64 time)"
        ];
        const newContract = new Contract(ADDRESS, abi, signer);
        const filter = newContract.filters.SoldTicket(seller, gallery_id);
        const data = await newContract.queryFilter(filter);
        // const days = range === "Full" ? range : String(multiplyBigDecimals(range, DAY_TIME));
        const days = range;
        const res = [];
        data.reverse(); // so we have data from most recent

        for(let i = 0; i < data.length; i++) {
            const [seller, gallery_index, price, time] = data[i].args;
            const date = time + "000";
            const days_cnt = getDaysCount(date);
            // console.log(days_cnt, String(new Date(date - 0)), date, time);

            // if days = "Full", it will always be false as JS cannot compare to letters
            if(compareVals(days_cnt, days, ">")) break;

            let price_val = 0, attendees_cnt = 0;
            let j = i;
            while(j < data.length && isSameDay_(data[j].args[3] + "000", date)) {
                // console.log(date, data[j].args[3], isSameDay_(data[j].args[3], date));
                price_val = addBigDecimals(price_val, data[j].args[2]);
                attendees_cnt += 1;
                j++;
            }
            // console.log("after", price_val, attendees_cnt);

            i = j - 1;
            
            res.push({ price: String(price_val), attendees: attendees_cnt, date: getDateWithOnlyMonth(date), gallery_id: String(gallery_id) });
        }
        res.reverse(); // so we revert back to say like Feb 18, Feb 19, ..., since we first reverted the data above
        return res;
    } catch (err) {
        throw new Error(err);
    }
};


export const getNftsAnalyticsData = async (signer, gallery_id) => {
    try {
        const ADDRESS = NFT_LIBRARY_ADDRESS;
        const accAbi = [`event AcceptedNft(address indexed creator, uint256 indexed gallery_id, uint256 approved_nft_id, uint64 time)`];
        const rejAbi = [`event RejectedNft(address indexed creator, uint256 indexed gallery_id, uint256 nft_id, uint64 time)`];
        const accContract = new Contract(ADDRESS, accAbi, signer);
        const rejContract = new Contract(ADDRESS, rejAbi, signer);
        const _id = parseBigInt(gallery_id);
        const acceptedFilter = accContract.filters.AcceptedNft(null, _id);
        const rejectedFilter = rejContract.filters.RejectedNft(null, _id);
        const acceptedData = (await accContract.queryFilter(acceptedFilter));
        const rejectedDataLen = (await rejContract.queryFilter(rejectedFilter)).length;
        
        // const fetchNftData = async (index) => {
        //     const n_id = parseBigInt(index);
        //     const nftSubmitContractInstance = await createNftSubmitContractInstance(signer);
        //     const nft_data = await nftSubmitContractInstance.getNftData(n_id); 
        //     const res = { ...parseNftMetaData(nft_data), nft_id: String(n_id) };
        //     return res;
        // };

        // const res = await Promise.all(acceptedData.map(({ args }) => fetchNftData(args[2]).then(res => res)));

        return { len: [acceptedData.length, rejectedDataLen] };

    } catch (err) {
        throw new Error(err);
    }
};

export const getGalleryAttendeesDistribution = (data_) => {
    const labels = [], data = [];
    for(const d_ of data_) {
        labels.push(d_.date);
        data.push(d_.attendees);
    }
    return { labels, data };
};

export const getGalleryLineData = (data_) => {
    const labels = [], data = [];
    for(const d_ of data_) {
        labels.push(d_.date);
        data.push(String(d_.price));
    }
    return { labels, data };
};

export const getNftsPriceDistribution = (data_) => {
    const prices = data_.map(res => {
        const { metadata } = res;
        return metadata.price - 0;
    });

    const { labels, data } = computeDistribution(prices);
    return { labels, data };
};

const computeDistribution = (data_) => {
    const dists = getDistribution(data_);
    const mp = new Map();
    let ref = 0;
    for(const dist of dists) {
        let cnt = 0;
        for(let d_ of data_) {
            if(compareVals(d_, ref, ">") && compareVals(d_, dist, "<=")) mp.set(`≤${dist}`, 1 + cnt++);
        }
        ref = dist;
    }

    const labels = [], data = [];
    const obj = Object.fromEntries(mp);
    Object.keys(obj).map((key, i) => {
        labels[i] = key;
        data[i] = obj[key];
        return null;
    });

    return { labels, data };
};


/* FOR ASSETS PAGE ANALYTICS */
export const getDistributionAboveAndBelowSetPrice = (req, nft_set_price) => {
    let above = 0, at = 0, below = 0;
    for(const data of req) {
        if(compareVals(data[0], nft_set_price, ">")) above += 1;
        else if(String(data[0]) === String(nft_set_price)) at += 1;
        else below += 1;
    }
    return [above, at, below];
};

export const getNftStakeDistribution = (data_, decimals) => {
    let mx = 0; // prices is String of prices and strings, even in decimals compare well
    const prices = data_.map(res => {
        if(compareVals(mx, res[0], "<")) mx = res[0];
        return multiplyBigDecimals(res[0], decimals);
    });
    // multiply first cus if we don't, mx might be 0.0000001 and divion rounded below to 2 d.p might result in 0.00
    mx = multiplyBigDecimals(mx, decimals);

    const dists = [
        multiplyBigDecimals(0.05, mx),
        multiplyBigDecimals(0.25, mx),
        multiplyBigDecimals(0.50, mx),
        multiplyBigDecimals(0.75, mx),
        String(mx)
    ];

    const mp = new Map();
    let ref = 0;
    for(const dist of dists) {
        let cnt = 0;
        for(let d_ of prices) {
            if(compareVals(d_, ref, ">") && compareVals(d_, dist, "<=")) {
                const ref_ = ref === 0 ? 0 : divideBigDecimals(ref, decimals, 2);
                const dist_ = divideBigDecimals(dist, decimals, 2);
                mp.set(`${ref_} < X ≤ ${dist_}`, 1 + cnt++);
            }
        }
        if(cnt) ref = dist;
    }

    const labels = [], data = [];
    const obj = Object.fromEntries(mp);
    Object.keys(obj).forEach(key => {
        if(obj[key]) {
            labels.push(key);
            data.push(obj[key]);
        }
    });

    return { labels, data };
};

export const getNfStaketLineData = (res) => {
    const labels = [], data = [];
    for(let i = 0; i < res.length; i++) {
        data[i] = String(res[i][0]);
        labels[i] = shortenAddy(res[i][2]);
    }

    return { labels, data };
};

export const formatAssetAnalyticsAddress = (addy) => {
    return addy.slice(0, 2) + "..." + addy.slice(-3);
};

export const priceDiff = (price, refPrice) => {
    const percentDiff = multiplyBigDecimals(divideBigDecimals(price, refPrice), 100);
    const amtDiff = subtractBigDecimals(refPrice, price);

    return { percentDiff, amtDiff };
};