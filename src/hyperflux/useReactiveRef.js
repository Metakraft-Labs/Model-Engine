import { useCallback } from "react";
import { useHookstate } from "./StateFunctions";

export const useReactiveRef = () => {
    const ref = useHookstate({ current });
    const handleRef = useCallback(node => {
        ref.current.set(node);
    }, []);
    return [ref.value, handleRef];
};
