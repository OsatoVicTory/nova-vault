import './styles.css';
import { BiSolidError } from 'react-icons/bi';

const ErrorPage = ({ fireFn, text, btnTxt }) => {

    return (
        <div className="error-page">
            <div>
                <div className='ep-iocn-div'>
                    <BiSolidError className='ep-icon' />
                </div>
                <p className='ep-h3 txt-white'>
                    {text || "There was an error loading the data. Check internet connection and Retry"}
                </p>
                <button className={`ep-btn pointer`} onClick={() => fireFn()}>
                    {btnTxt || "Retry"}
                </button>
            </div>
        </div>
    );
};

export default ErrorPage;