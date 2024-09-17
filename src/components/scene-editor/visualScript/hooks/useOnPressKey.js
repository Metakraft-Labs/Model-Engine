import { useEffect } from "react";

export const useOnPressKey = (key, callback) => {
    useEffect(() => {
        const handleKeyDown = e => {
            if (e.code === key) {
                callback(e);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [key, callback]);
};
