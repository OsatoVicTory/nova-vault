import throttle from "lodash.throttle";
import { useCallback, useContext, useEffect, useRef } from "react";
import { AppContext } from "../context";

const useGetToolTip = (hovRef, text, deps = [], center = false, ignoreEllipsis = false, cooldown = 300) => {

    const { setTooltipContent } = useContext(AppContext);
    const textRef = useRef(text);
    
    const activeFn = (e) => {
        const { top, left, right, bottom, width } = e.target.getBoundingClientRect();
        setTooltipContent({  txt: textRef.current, center, ignoreEllipsis, rect: { width, top, left, right, bottom } });
    };
    const offFn = () => {
        setTooltipContent({});
    };

    const activeTooltip = useCallback(throttle((e) => activeFn(e), cooldown), []);

    const activeTooltipClose = useCallback(throttle((e) => offFn(e), cooldown), []);

    useEffect(() => {
        textRef.current = text;
    }, [text]);

    useEffect(() => {
        if(!deps[0]) {
            if(hovRef.current) {
                hovRef.current.addEventListener("mouseenter", activeTooltip);
                hovRef.current.addEventListener("mouseleave", activeTooltipClose);
            }
        }

        return () => {
            if(hovRef.current) {
                hovRef.current.removeEventListener("mouseenter", activeTooltip);
                hovRef.current.removeEventListener("mouseleave", activeTooltipClose);
            }
            offFn();
        };

    }, deps);
};

export default useGetToolTip;