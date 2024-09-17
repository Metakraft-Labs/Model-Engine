import { useEffect, useState } from "react";

export function useMergeMap(mapA, mapB) {
    const [result, setResult] = useState(() => ({ ...mapA, ...mapB }));

    useEffect(() => {
        setResult({ ...mapA, ...mapB });
    }, [mapA, mapB]);

    return result;
}
