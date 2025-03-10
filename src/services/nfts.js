import { Contract } from "ethers";
import { 
    createERC1155ContractInstance, createNftSubmitContractInstance, 
    ERC1155_ADDRESS, NFT_LIBRARY_ADDRESS, NFT_MARKET_ADDRESS, 
    NFT_SUBMIT_ADDRESS, parseBigInt 
} from "./creators";
import { parseNftMetaData } from "../utils";
import { INFURA_ID } from "../config";

export const fetchCreatedNFTs = async (signer, user = null) => {
    const ADDRESS = NFT_LIBRARY_ADDRESS;
    const abi = [
        "event SubmitedNft(uint256 indexed gallery_id, address creator, uint256 nft_index, uint64 time)"
    ];
    const newContract = new Contract(ADDRESS, abi, signer);
    const filter = newContract.filters.SubmitedNft(null);
    const data = await newContract.queryFilter(filter);
    const res = [];
    for(let i = 0; i < data.length; i++) {
        const [gallery_id, creator, nft_index, date] = data[i].args;
        if(!user || creator === user) res.push({gallery_id, creator, nft_library_id: nft_index, date});
    }
    return res;
};

export const fetchAccessibleGalleries = async (address, contractInstance, fetchGallery) => {
    const len_created = await contractInstance.getLenUc(address, 0);
    const res_created = await Promise.all(
        Array((len_created + "") - 0).fill(0).map((v, i) => {
            return fetchGallery(parseBigInt(i), contractInstance).then(res => res);
        })
    );
    const len_joined = await contractInstance.getLenUc(address, 1);
    const res_joined = await Promise.all(
        Array((len_joined + "") - 0).fill(0).map((v, i) => {
            return fetchGallery(parseBigInt(i), contractInstance).then(res => res);
        })
    );

    const mp = new Map(), res = [];
    const d_ = new Date().getTime() / 1000;
    res_created.concat(res_joined).forEach(r => {
        if(!mp.has(r.gallery_id)) {
            // if voting has ended then minting or claiming has started and so metadat can be fetched
            if(d_ > r.votingEnd) res.push(r.gallery_id);
            mp.set(r.gallery_id, 1);
        }
    });
    return res;
};


// var wsProvider = new ethers.providers.WebSocketProvider("wss://rinkeby.infura.io/ws/v3/idhere");

// let contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wsProvider);

// contract.on("*", (from, to, value, event) => {
//   console.log("event: ", event);
// });

// 59e9f0865eea4b65a8feff38b21510f3 // key infura
// mgGlXka3gbcPQhA+TB1Rd8afza7uEE2tRbqYWwrcXZdU2hwIZRfOwA // secret infura

export const INFURA_URL = `wss://arbitrum-sepolia.infura.io/ws/v3/${INFURA_ID}`;

export const fetchNotificationNFTs = async (signer, ids) => {
    const ADDRESS = NFT_LIBRARY_ADDRESS;
    const abi = [
        "event SubmitedNft(uint256 indexed gallery_id, address creator, uint256 nft_index, uint64 time)"
    ];
    const newContract = new Contract(ADDRESS, abi, signer);
    const res = [];
    for(const id of ids) {
        const filter = newContract.filters.SubmitedNft(parseBigInt(id));
        const data = await newContract.queryFilter(filter); // this filtering is more efficient
        for(let i = 0; i < data.length; i++) {
            const [gallery_id, creator, nft_index, date] = data[i].args;
            res.push({ 
                gallery_id: String(gallery_id), creator, 
                nft_library_id: String(nft_index), date
            });
        }
    }
    return res;
};

export const fetchSubmitedNFTs = async (signer, user) => {
    const ADDRESS = NFT_SUBMIT_ADDRESS;
    const abi = [
        "event SubmitNft(address indexed owner, uint256 gallery_index, uint256 meta_data_nft_id)"
    ];
    const newContract = new Contract(ADDRESS, abi, signer); 
    const filter = newContract.filters.SubmitNft(user);
    const data = await newContract.queryFilter(filter);
    const res = [];
    for(let i = 0; i < data.length; i++) {
        const [owner, gallery_id, meta_data_nft_id] = data[i].args;
        res.push({ owner, gallery_id: gallery_id, nft_id: meta_data_nft_id });
    }
    return res;
};

export const fetchAcceptedNFTs = async (signer, user) => {
    const ADDRESS = NFT_LIBRARY_ADDRESS;
    const abi = [
        `event AcceptedNft(address indexed creator, uint256 indexed gallery_id, uint256 approved_nft_id, uint64 time)`
    ];
    const newContract = new Contract(ADDRESS, abi, signer); 
    const filter = newContract.filters.AcceptedNft(user, null);
    const data = await newContract.queryFilter(filter);
    const res = [];
    for(let i = 0; i < data.length; i++) {
        const [owner, gallery_id, nft_library_id] = data[i].args;
        res.push({ owner, gallery_id: String(gallery_id), nft_library_id: String(nft_library_id) });
    }
    return res;
};

export const fetchCollectedNFTs = async (signer, user) => {
    const ADDRESS = ERC1155_ADDRESS;
    const singleAbi = [
        "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value, uint32 time)"
    ];
    const batchAbi = [
        "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values, uint32 time)"
    ];
    const singleContract = new Contract(ADDRESS, singleAbi, signer);
    const batchContract = new Contract(ADDRESS, batchAbi, signer); 
    const singleFilter = singleContract.filters.TransferSingle(null, null, user);
    const batchFilter = batchContract.filters.TransferBatch(null, null, user);
    const s_data = Array.from(await singleContract.queryFilter(singleFilter));
    const b_data = Array.from(await batchContract.queryFilter(batchFilter));
    const set = new Set();
    let i = 0;
    while(i < s_data.length && i < b_data.length) {
        set.add(s_data[i].args[3]);
        const ids = b_data[i].args[3];
        for(let id of ids) set.add(id);
        i++;
    }
    while(i < s_data.length) {
        set.add(s_data[i++].args[3]);
    }
    while(i < b_data.length) {
        const ids = b_data[i++].args[3];
        for(let id of ids) set.add(id);
    }
    return Array.from(set);
};

export const fetchOwnedNFTs = async (signer, user, ids) => {
    const contractInstance = await createERC1155ContractInstance(signer);
    const res_ = Array.from(await contractInstance.balanceOfBatch(Array(ids.length).fill(user), ids));
    const resp = [];
    for(let i = 0; i < res_.length; i++) {
        if(res_[i] > 0) resp.push(ids[i]);
    }
    return resp;
};

export const fetchNftSales = async (signer, user) => {
    const ADDRESS = NFT_MARKET_ADDRESS;
    const abi = [
        "event Sold(address indexed pre_owner, address indexed new_owner, uint256 indexed nft_id, uint64 time)"
    ];
    const salesContract = new Contract(ADDRESS, abi, signer);
    const filter = salesContract.filters.Sold(user, null, null);
    const data = await salesContract.queryFilter(filter); 

    const fn_ = async (args) => {
        const [pre_owner, new_owner, token_id, time] = args;
        const contractInstance = await createERC1155ContractInstance(signer);
        const [gallery_id, nft_library_id, nft_id] = await contractInstance.getData(token_id);
        const nftSubmitContractInstance = await createNftSubmitContractInstance(signer);
        const nft_data = await nftSubmitContractInstance.getNftData(nft_id);
        const p = parseNftMetaData(nft_data);
        return {
            ...p.metadata, gallery_id: String(gallery_id), new_owner, date: time,
            nft_library_id: String(nft_library_id), nft_id: String(nft_id), token_id: String(token_id)
        };
    };

    const res = await Promise.all(data.map((d_) => fn_(d_.args).then(res => res)));
    return res;
};