import './styles.css';

export const Skeleton = () => {
    return (
        <div className="Skeleton"></div>
    );
};

export const LoadingSpinner = ({ height, width }) => {
    return (
        <div className='spinner' style={{ height: height, width: width }}></div>
    );
};