import { getFullDateWithTime, compareVals } from '../../../utils';
// import nft_image from '../../../assets/nft_1.png';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { AppContext } from '../../../context';
import LeaderBoardList from './list';
import useGetToolTip from '../../../hooks/useGetToolTip';
import LeaderBoardLoading from './loading';
import { divideBigDecimals, multiplyBigDecimals, subtractBigDecimals } from '../../../services/creators';
import ErrorPage from '../../../components/error';
import NoData from '../../../components/noData';

const LeaderBoard = ({ closePage, getAddress, width, minimumStakeAmt, g_id, n_id, nft_data, stakers }) => {

    const { scrollPosition } = useContext(AppContext);
    const [loading, setLoading] = useState({ state: true, loaded: false });
    const [leaderboard, setLeaderBoard] = useState([]);
    const [range, setRange] = useState(20);
    const [error, setError] = useState(false);
    const priceDiffRef = useRef();
    const skeletons = Array(10).fill(0);

    const getData = (data) => {
        const { stake_amount } = data;
        const subtract = subtractBigDecimals(stake_amount, minimumStakeAmt);
        const percent_diff = multiplyBigDecimals(divideBigDecimals(subtract, minimumStakeAmt), 100);
        return { 
            ...data, percent_diff, level: compareVals(stake_amount, minimumStakeAmt, ">") ? "above" : "",
            class_name: compareVals(stake_amount, minimumStakeAmt, ">") ? "txt-positive": "txt-white"
        };
    };

    const fetchLeaderBoard = async () => {
        try {
            // only sort stakers data by stake_amount
            console.log("leaderboard-loading...")
            setLoading({ ...loading, state: true });
            setError(false);

            console.log(stakers, minimumStakeAmt);
            setLeaderBoard(stakers.map(val => getData(val)));
            return setLoading({ loaded: true, state: false });
        } catch(err) {
            console.log(err);
            setError(true);
            setLoading({ ...loading, state: false });
        }
    }

    useEffect(() => {
        fetchLeaderBoard();
    }, [range]);

    useGetToolTip(priceDiffRef, "Percentage difference from Floor price");

    const getDate = useCallback((date) => {
        date = getFullDateWithTime(date, 1000);
        if((width <= 1024 && width >= 781) || width <= 610) return date.slice(0, -9);
        else return date;
    }, [width]);

    const scrolled = useMemo(() => {
        return scrollPosition.y >= 100;
    }, [scrollPosition.y]);

    const showLoadingSkeletons = useMemo(() => {
        return (loading.state && !loading.loaded);
    }, [loading.state, loading.loaded]);

    return (
        <div className='LB w-full'>
            <div className='lb-wrapper w-full'>
                <div className={`lbw-header w-full ${scrolled}`}>
                    <div className='lbwh w-full'>
                        <img src={nft_data.img} alt='nft' />
                        <span className='txt-white'>{nft_data.name}</span>
                        <button className='pointer' onClick={() => closePage()}><AiOutlineClose className='lbwh-icon txt-white' /></button>
                    </div>
                    <h2 className='txt-white'>LeaderBoard Standings</h2>
                    <div className={`lbwm-head w-full`}>
                        <div className='lbwm-li-div'>
                            <div><span className='txt-white sn-pad'>Rank</span></div>
                            <div className='lbwm-li-name'><span className='txt-white'>Address</span></div>
                            <div><span className='txt-white tf-amt'>Amount</span></div>
                            <div className="percent-diff"><span className='txt-white' ref={priceDiffRef}>
                                {width >= 650 ? "% Difference" : "% Diff."}</span></div>
                            <div className='lb-date'><span className='txt-white'>Date</span></div>
                        </div>
                    </div>
                </div>
                <div className='lbwm-d w-full'>
                    {
                        (error && !loading.loaded) ? 
                        <div className="lbwm-error w-full">
                            <ErrorPage fireFn={fetchLeaderBoard} />
                        </div>
                        :
                        (
                            (loading.loaded && leaderboard.length === 0) 
                            ?
                            <div className="lbwm-error w-full">
                                <NoData text={"No Staker yet for this nft."} />
                            </div>
                            :
                            <ul className='lbwm-ul'>
                                {(showLoadingSkeletons ? skeletons : leaderboard).map((val, index) => (
                                    <li key={`lbwm-li-${index}`} className='lbwm-li w-full'>
                                        {
                                            showLoadingSkeletons ?
                                            <LeaderBoardLoading />
                                            :
                                            <LeaderBoardList index={index} loading={loading.state}
                                            val={val} getAddress={getAddress} getDate={getDate} />
                                        }
                                    </li>
                                ))}
                            </ul>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default LeaderBoard;