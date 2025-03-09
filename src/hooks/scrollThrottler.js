import { useCallback, useEffect } from "react";
import throttle from "lodash.throttle";

const useScrollThrottler = (scrollRef, fn, deps = [], cooldown = 500) => {
    const handleScroll = useCallback(throttle((e) => fn(e), cooldown), []);

    useEffect(() => {
        if(scrollRef.current) {
            scrollRef.current.addEventListener("scroll", handleScroll);
        }
        return () => {
            if(scrollRef.current) {
                scrollRef.current.removeEventListener("scroll", handleScroll);
            }
        }
    }, deps);
};

export default useScrollThrottler;