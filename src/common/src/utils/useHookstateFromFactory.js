import { useEffect, useState } from "react";

import { useHookstate } from "../../../hyperflux";

export const useHookstateFromFactory = cb => {
    const state = useHookstate({});
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        if (mounted) return;
        state.set(cb());
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);
    return state;
};
