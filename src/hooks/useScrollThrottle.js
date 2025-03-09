import { useCallback, useEffect } from "react";
import throttle from "lodash.throttle";

const useScrollThrottle = (setScrollPosition, cooldown = 500) => {

    const fn = (e) => {
        const { scrollTop, scrollLeft, scrollHeight, offsetHeight } = e.target;
        // console.log(scrollTop)
        setScrollPosition({ x: scrollLeft, y: scrollTop, scrollHeight, offsetHeight });
    };

    const handleScroll = useCallback(throttle((e) => fn(e), cooldown), []);

    useEffect(() => {
        const ele = document.getElementById('main-scroll');

        if(ele) ele.addEventListener('scroll', handleScroll);

        return () => {
            if(ele) ele.removeEventListener('scroll', handleScroll);
        }
    }, []);
};

export default useScrollThrottle;