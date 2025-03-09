import { Skeleton } from '../../../components/loading';
import './leaderboard.css';

const LeaderBoardLoading = () => {

    return (
        <div className='lbwm-li-div'>
            <div><span className='txt-white sn-pad loading'><Skeleton /></span></div>
            <div className='lbwm-li-name'><span className='txt-white loading'><Skeleton /></span></div>
            <div><span className='txt-white t-flex tf-amt loading'><Skeleton /></span></div>
            <div className="percent-diff"><span className={`lbwm-txt t-flex txt-white loading`}><Skeleton /></span></div>
            <div className='lb-date'><span className='txt-white loading'><Skeleton /></span></div>
        </div>
    );
};

export default LeaderBoardLoading;