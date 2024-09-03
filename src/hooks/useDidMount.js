import { useEffect, useRef } from "react";

export const useDidMount = (func, deps = []) => {
    const didMount = useRef(false);

    useEffect(() => {
        let ret = undefined;
        if (didMount.current) ret = func();
        else didMount.current = true;

        return ret;
    }, deps);
};
