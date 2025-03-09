import { Skeleton } from "../../components/loading";
import "./styles.css";

const TxnsLoading = () => {

    const txns = Array(10).fill(0);

    return (
        <div className="txns-main w-full">
            {txns.map((val, idx) => (
                <div className="txn w-full" key={`txns-${idx}`}>
                    <div className="txn-large">
                        <div className="txn-sn loading"><Skeleton /></div>
                        <div className={`txn-icon-div loading`}><Skeleton /></div>
                        <div className="txn-type loading"><Skeleton /></div>
                        <div className="full-address">
                            <div className="txn-address loading"><Skeleton /></div>
                        </div>
                        <div className={`txn-amount loading`}><Skeleton /></div>
                        <div className="full-address">
                            <div className="txn-date loading"><Skeleton /></div>
                        </div>
                    </div>

                    <div className="txn-mobile">
                        <div className={`txn-icon-div loading`}><Skeleton /></div>
                        <div className="txn-txt">
                            <div className="txn-type loading"><Skeleton /></div>
                            <div className="full-address">
                                <div className="txn-address loading"><Skeleton /></div>
                            </div>
                        </div>
                        <div className="txn-txt">
                            <div className={`txn-amount loading`}><Skeleton /></div>
                            <div className="full-address">
                                <div className="txn-date loading"><Skeleton /></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
        </div>
    );
};

export default TxnsLoading;