import './styles.css';
import noData from '../assets/no-data.jpg';

const NoData = ({ text, btnFn, btnTxt }) => {

    return (
        <div className="noData">
            <div className="noData-img">
                <img src={noData} alt='no-data' />
            </div>
            <h3 className='txt-white'>{text}</h3>
            {btnFn && <button className={`ep-btn pointer`} onClick={() => btnFn()}>
                {btnTxt || 'Retry'}
            </button>}
        </div>
    )
};

export default NoData;