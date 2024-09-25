/** @deprecated use iterateEntityNode instead*/
export default function iterateObject3D(
    root,
    callback,
    predicate = _ => true,
    snubChildren = false,
    breakOnFind = false,
) {
    const result = [];
    const frontier = [[root]];
    do {
        const entry = frontier.pop() ?? [];
        for (const obj3d of entry) {
            const children = obj3d?.children ?? [];
            if (predicate(obj3d)) {
                result.push(callback(obj3d));
                if (breakOnFind) break;
                snubChildren && frontier.push([...children]);
            }
            !snubChildren && frontier.push([...children]);
        }
    } while (frontier.length > 0);
    return result;
}
