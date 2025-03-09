import { Skeleton } from "../../components/loading";
import "./analytics.css";

const AnalyticsHomeLoading = ({ route, isMobile }) => {

    const galleries = Array(10).fill(0);

    return (
        <div className="analytics-contents w-full">
            <ul className="anct-ul">
                <li className="anct-li w-full t-header">
                    {!isMobile && <div className="anct-div t-desktop">
                        <div className="anct-item">
                            <div className="anct-index txt-white">#</div>
                            <span className="txt-white">{route}</span>
                        </div>
                        <div className="anct-price">
                            <span className="txt-white">Price (in NOVA)</span>
                        </div>
                        {/* <div className="anct-change">
                            <span className="txt-white">24hr Change</span>
                        </div> */}
                        <div className="anct-count">
                            <span className="txt-white">{route === "Galleries" ? "Attendees" : "Stakers"}</span>
                        </div>
                        <div className="anct-date">
                            <span className="txt-white">Date</span>
                        </div>
                    </div>}

                    {isMobile && <div className="anct-div t-mobile">
                        <div className="anct-start">
                            <span className="txt-white">Logo</span>
                        </div>
                        <div className="anct-center">
                            <span className="anct-name t-bold txt-white">{route}</span>
                        </div>
                        <div className="anct-end">
                            <span className="txt-white">Price (in NOVA)</span>
                        </div>
                    </div>}
                </li>

                {galleries.map((val, idx) => (
                    <li className="anct-li w-full" key={`anct-li-${idx}`}>
                        <div className="anct-a w-full">
                            {!isMobile && <div className="anct-div t-desktop loading">
                                <div className="anct-item">
                                    <div className="anct-index txt-white loading"><Skeleton /></div>
                                    <div className="ancti-img"><Skeleton /></div>
                                    <span className="txt-white loading"><Skeleton /></span>
                                </div>
                                <div className="anct-price">
                                    <span className="txt-white loading"><Skeleton /></span>
                                </div>
                                <div className="anct-change">
                                    <div className={`anct-stats loading`}>
                                        <Skeleton />
                                    </div>
                                </div>
                                <div className="anct-count">
                                    <span className="txt-white loading"><Skeleton /></span>
                                </div>
                                <div className="anct-date">
                                    <span className="txt-white loading"><Skeleton /></span>
                                </div>
                            </div>}

                            {isMobile && <div className="anct-div t-mobile loading">
                                <div className="anct-index loading"><Skeleton /></div>
                                <div className="anct-start">
                                    <div className="ancti-img"><Skeleton /></div>
                                </div>
                                <div className="anct-center">
                                    <span className="anct-name t-bold txt-white loading"><Skeleton /></span>
                                    <div className="anct-cnt txt-white loading"><Skeleton /></div>
                                </div>
                                <div className="anct-end">
                                    <span className="anct-price t-bold txt-white loading"><Skeleton /></span>
                                    <div className={`anct-stats loading`}><Skeleton /></div>
                                </div>
                            </div>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AnalyticsHomeLoading;