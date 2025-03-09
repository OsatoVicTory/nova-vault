import { Link } from 'react-router-dom';
import './leaderboard.css';
import { useCallback, useRef } from 'react';
import useGetToolTip from '../../../hooks/useGetToolTip';
import { parseAmount } from '../../../utils';

const LeaderBoardList = ({ index, val, getAddress, getDate }) => {
    const hovRef = useRef();

    const text = `Ranked: ${index + 1} \n${val.staker} \npaid ${val.stake_amount} $NOVA (${val.percent_diff} ${val.level} price) \non ${getDate(val.date)}`;

    useGetToolTip(hovRef, text, [false], true, true);

    const parseAmount_ = useCallback((amt) => {
        return parseAmount(amt||0);
    }, [val]);

    return (
        <div className='lbwm-li-div' ref={hovRef}>
            <div><span className='txt-white sn-pad'>{index + 1}</span></div>
            <Link to={`/app/account/${val.staker}`} className='lbwm-li-name'><span>{getAddress(val.staker)}</span></Link>
            <div><span className='txt-white t-flex tf-amt'>
                {parseAmount_(val.stake_amount)} <div className="nftf-token-symbol txt-white">NOVA</div>
            </span></div>
            <div className="percent-diff"><span className={`lbwm-txt t-flex txt-white ${val.class_name}`}>
                {parseAmount_(val.percent_diff)}% <span className="lbwm-t t-percent-ref txt-white">{val.level}</span>
            </span></div>
            <div className='lb-date'><span className='txt-white'>{getDate(val.date)}</span></div>
        </div>
    );
};

export default LeaderBoardList;