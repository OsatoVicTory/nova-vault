export const getEventsData = async (Contract, filter, getDataFromArgs, prevLen = 0, range = 20) => {
    try {
        const res = [];
        const data = (
            range === "full" ?
            (await Contract.queryFilter(filter)) : 
            (await Contract.queryFilter(filter)).slice(-range)
        );
        const LIM = data.length - prevLen - 1; // -1 because of zero indexing

        for(let i = 0; i < data.length; i++) {
            if(i > LIM) break;

            const res_data = getDataFromArgs(data[i].args);
            const date = await getDateFromBlockNumber(data[i].blockNumber);
            
            res.push({ ...res_data, date });
        };
        return res;
    } catch (err) {
        throw new Error(err);
    }
};

// export const getEventsData_ = async (Contract, filter, getDataFromArgs, prevLen = 0, range = 20) => {
//     try {
//         const res = [];
//         const data = (
//             range === "full" ?
//             (await Contract.queryFilter(filter)) : 
//             (await Contract.queryFilter(filter)).slice(-range)
//         );
//         const LIM = data.length - prevLen - 1; // -1 because of zero indexing

//         for(let i = 0; i < data.length; i++) {
//             if(i > LIM) break;

//             const res_data = getDataFromArgs(data[i].args);
//             const date = await getDateFromBlockNumber(data[i].blockNumber);
            
//             res.push({ ...res_data, date });
//         };
//         return res;
//     } catch (err) {
//         throw new Error(err);
//     }
// };

export const getDateFromBlockNumber = async (blockNumber, isAllowed = true) => {
    if(!isAllowed) return "";

    await new Promise(res => setTimeout(res, 300));

    const apiUrl = `https://api-sepolia.arbiscan.io/api?module=block&action=getblockreward&blockno=${blockNumber}`;
    const res = await fetch(apiUrl);
    const res_data = await res.json();
    if(res_data.status === '1') {
        const timestamp = parseInt(res_data.result.timeStamp, 10);
        return timestamp;
    }
    return "";
};