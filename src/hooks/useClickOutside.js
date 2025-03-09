import { useCallback, useEffect } from "react";

const useClickOutside = (modalRef, closeFn, waitOptions = {}) => {

    function fn(e) {
        if(!modalRef.current) return;
        if(modalRef.current && !modalRef.current.contains(e.target)) { 
            if(waitOptions.current) return;
            closeFn(); 
        }
    };

    const clickFn = useCallback((e) => fn(e), []);

    useEffect(() => {
        document.addEventListener("click", clickFn, true);

        return () => document.removeEventListener("click", clickFn, true);
    
    }, []);

};

export default useClickOutside;