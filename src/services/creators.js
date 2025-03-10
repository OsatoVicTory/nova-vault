import { Contract, ethers } from "ethers";
import BigDecimal from 'js-big-decimal';

import userMetadata from "../abi/user_reg/userRegAbi.json";

import erc20 from "../abi/erc20/erc20_abi.json";

import erc1155 from "../abi/erc1155/erc1155Abi.json";

import nft_market from "../abi/nft_market/contractAbi.json";

import nft_library from "../abi/nft_lib/nft_libAbi.json";

import nft_submit from "../abi/nft_sub/nftSubAbi.json";

import stake from "../abi/stake/stakeAbi.json";

import gallery from "../abi/gallery/galleryAbi.json";

import ticket_sale from "../abi/ticket_sale/ticketSaleAbi.json";

import safe_vote from "../abi/safe_vote/safeVoteAbi.json";

import minter from "../abi/minter/minterAbi.json";


export const USER_METADATA_ADDRESS = "0xd8b40307a102f410c2466653ded9f9f77767203b";
export const GALLERY_ADDRESS = "0xdd50353fa92ac538812c9af4dd7594118fdcda2e";
export const ERC20_ADDRESS = "0xedbb9a30243a04b36d6acb511bdd802150feb183";
export const ERC1155_ADDRESS = "0x845d93050abbc69ca01daca98edf25e983c9be8a";
export const NFT_MARKET_ADDRESS = "0xd5c05fd2fc918f0c48bebf0c696e51e724a17ccf";
export const NFT_LIBRARY_ADDRESS = "0xc098282b47406f3bdcf12eacc426a490584a52a5";
export const NFT_SUBMIT_ADDRESS = "0x2b1d5d33bf87d0f832609d08aa9efae6a8c0e2a3";
export const STAKE_ADDRESS = "0x067139cdefc74fda54bd8df619ae107f817e9439";
export const TICKET_SALE_ADDRESS = "0xe980c013c4ece92afb278f7e21e8ed52eeef91aa";
export const SAFE_VOTE_ADDRESS = "0x364b378751c10cdbc700c78d45fc84b2af0d2c67"; // "0xffaf5e879e67d4bed37be3e19b09f67d1013bc6a";
export const MINTER_ADDRESS = "0xe749d56077b311af4237c3767b0f2a83d2f8d8ca";

export const parseBigInt = (uint8) => {
    return ethers.getBigInt(uint8, "myBigInt");
};

export const compareAddress = (address, userAddress) => {
    const isAddress = ethers.isAddress(userAddress);
    if(isAddress) userAddress = ethers.getAddress(userAddress);
    return address === userAddress;
};


export const getPriceInEth = (token, ethPrice, round = 4, decimals=10000000000) => {
    const token_bigint = multiplyBigDecimals(token, decimals);
    const eth_price_bigint = multiplyBigDecimals(token_bigint, ethPrice);
    const res = ethers.formatEther(eth_price_bigint);
    if(!round) return res;
    else {
        const str = String(res);
        const exp = str.includes(".") ? parseFloat(str) : parseInt(str);
        return exp.toExponential(round);
    }
};

export const getAppAddress = (address) => {
    return ethers.getAddress(address);
};

export const formatEthBalance = (bal) => {
    return String(ethers.formatEther(bal));
};

export const parseEth = (eth) => {
    return String(ethers.parseEther(eth));
};

export const parseBigIntNumberForBackend = (value, dec = 10000000000) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(dec+'');
    const result = BigDecimal.stripTrailingZero((n1.multiply(n2)).getValue());
    return String(result);
};

export const parseBigIntNumberForFrontend = (value, dec = 10000000000) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(dec+'');
    const result = BigDecimal.stripTrailingZero((n1.divide(n2)).getValue());
    return String(result);
};
export const getDecimals = (dec) => {
    return ethers.parseUnits("1", Number(dec));
};

export const parseBigIntDecimal = (val, str = false) => {
    if(!str) return (new BigDecimal(val)).getValue();
    return String((new BigDecimal(val)).getValue());
};

export const getTokenAmount = (value, decimals=10000000000) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(decimals+'');
    const result = BigDecimal.stripTrailingZero((n1.divide(n2)).getValue());
    return String(result);
};

export const multiplyBigDecimals = (value, mul) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(mul+'');
    const result = BigDecimal.stripTrailingZero((n1.multiply(n2)).getValue());
    return String(result);
};

export const divideBigDecimals = (value, decimals, round = 0) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal((decimals || 1E10) + ''); // wallet decimals may not be available at specific immediate instance
    const result = BigDecimal.stripTrailingZero((n1.divide(n2)).getValue());
    if(round) {
        const str = String(result);
        const res = str.includes(".") ? parseFloat(str) : parseInt(str);
        return res.toExponential(round);
    } else {
        return String(result);
    }

    // const result = BigDecimal.stripTrailingZero((n1.divide(n2)).getValue());
    // if(round) {
    //     const res = result
    //     // return String(new BigDecimal(result).round(round, BigDecimal.RoundingModes.DOWN).getValue());
    // }
    // return String(result);
};

export const addBigDecimals = (value, amt) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(amt+'');
    const result = (n1.add(n2)).getValue();
    return result;
};

export const subtractBigDecimals = (value, amt) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(amt+'');
    const result = (n1.subtract(n2)).getValue();
    return result;
};

export const createUserContractInstance = async (signer) => {
    return await new Contract(USER_METADATA_ADDRESS, userMetadata, signer);
};

export const createERC1155ContractInstance = async (signer) => {
    return await new Contract(ERC1155_ADDRESS, erc1155, signer);
};

export const createERC20ContractInstance = async (signer) => {
    return await new Contract(ERC20_ADDRESS, erc20, signer);
};

export const createGalleryContractInstance = async (signer) => {
    return await new Contract(GALLERY_ADDRESS, gallery, signer);
};

export const createNftMarketContractInstance = async (signer) => {
    return await new Contract(NFT_MARKET_ADDRESS, nft_market, signer);
};

export const createNftLibraryContractInstance = async (signer) => {
    return await new Contract(NFT_LIBRARY_ADDRESS, nft_library, signer);
};

export const createNftSubmitContractInstance = async (signer) => {
    return await new Contract(NFT_SUBMIT_ADDRESS, nft_submit, signer);
};

export const createStakeContractInstance = async (signer) => {
    return await new Contract(STAKE_ADDRESS, stake, signer);
};

export const createTicketSaleContractInstance = async (signer) => {
    return await new Contract(TICKET_SALE_ADDRESS, ticket_sale, signer);
};

export const createSafeVoteContractInstance = async (signer) => {
    return await new Contract(SAFE_VOTE_ADDRESS, safe_vote, signer);
};

export const createMinterContractInstance = async (signer) => {
    return await new Contract(MINTER_ADDRESS, minter, signer);
};