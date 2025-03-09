import { useCallback, useEffect } from "react";
import throttle from "lodash.throttle";

const useResizeThrottle = (fn, cooldown = 300) => {

    const handleResize = useCallback(throttle((e) => fn(window.innerWidth), cooldown), []);

    useEffect(() => {
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);
};

export default useResizeThrottle;