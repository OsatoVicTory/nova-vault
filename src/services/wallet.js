import { Contract } from "ethers";
import { addBigDecimals, ERC20_ADDRESS, getTokenAmount } from "./creators";
import { getDateWithOnlyMonth, isSameDay } from "../utils";

export const fetchWalletTransactions = async (signer, user) => {
    const ADDRESS = ERC20_ADDRESS;
    const abi = [
        "event Transfer(address indexed from, address indexed to, uint256 value, uint64 time)"
    ];
    const newContract = new Contract(ADDRESS, abi, signer);
    const filter = newContract.filters.Transfer(user, null);
    const to_filter = newContract.filters.Transfer(null, user);
    const data_from = await newContract.queryFilter(filter);
    const data_to = await newContract.queryFilter(to_filter);
    const data = data_from.concat(data_to).sort((a, b) => {
        return b.args[3] > a.args[3] ? 1 : b.args[3] < a.args[3] ? -1 : 0
    });
    const res = [];
    for(let i = 0; i < data.length; i++) {
        const [from, to, amount, date] = data[i].args;
        res.push({ 
            from, to, amount: String(getTokenAmount(amount)), 
            date, type: from === user ? "Transfer" : "Received",
            address: from === user ? to : from 
        });
    }
    return res;
};

export const d_ = (date) => {
    return parseInt(Number(String(date)) * 1000);
};

export const getWalletTimeChartData = (res_) => {
    const labels = [], data_trans = [], data_rec = [];
    // console.log(res_);
    let date_ = 0, cnt = 0;
    for(let i = 0; i < res_.length; i++) {
        let j = i;
        let sum_rec = 0, sum_trans = 0;
        while(j < res_.length && isSameDay(d_(res_[i].date), d_(res_[j].date))) {
            if(res_[j].type === "Transfer") sum_trans = addBigDecimals(sum_trans, res_[j].amount);
            else sum_rec = addBigDecimals(sum_rec, res_[j].amount);
            j++;
        }
        // console.log(i, j, sum_rec, sum_trans, getDateWithOnlyMonth(d_(res_[i].date)));
        data_trans.push(String(sum_trans));
        data_rec.push(String(sum_rec));
        labels.push(getDateWithOnlyMonth(d_(res_[i].date)));
        i = j - 1;
        cnt++;
        if(cnt >= 30) break;
    }
    // console.log(labels, data_rec, data_trans);
    return { labels: labels.reverse(), data_rec: data_rec.reverse(), data_trans: data_trans.reverse() };
};