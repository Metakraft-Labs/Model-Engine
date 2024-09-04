export function memo(func) {
    let cache;
    return () => {
        if (cache === undefined) {
            cache = func();
        }
        return cache;
    };
}

export function asyncMemo(func) {
    let cache;
    return async () => {
        if (cache === undefined) {
            cache = await func();
        }
        return cache;
    };
}
