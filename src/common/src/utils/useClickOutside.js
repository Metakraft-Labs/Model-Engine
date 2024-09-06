import { useEffect } from "react";

export const useClickOutside = (ref, onClickOutsideCallback) => {
    useEffect(() => {
        const onClickOutside = event => {
            if (ref.current && !ref.current.contains(event.target)) {
                onClickOutsideCallback(event);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [ref.current]);
};
