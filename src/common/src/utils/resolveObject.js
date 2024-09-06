export function resolveObject(obj, path) {
    const keyPath = Array.isArray(path) ? path : path.split(".");
    return keyPath.reduce((prev, curr) => prev?.[curr], obj);
}
