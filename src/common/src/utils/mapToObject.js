import { cloneDeep, merge } from "lodash";

export const mapToObject = map =>
    Array.from(map.entries()).reduce((obj, [key, value]) => {
        return merge({ [key]: value }, obj);
    }, {});

export const iterativeMapToObject = root => {
    const seen = new Set();
    const iterate = obj => {
        if (typeof obj !== "object" || obj === null) return obj;
        const output = {};
        for (const [key, value] of Object.entries(obj)) {
            if (seen.has(value)) continue;
            if (typeof value === "object") seen.add(value);
            if (!value) {
                output[key] = value;
            } else if (value instanceof Map && value) {
                output[key] = mapToObject(value);
            } else if (Array.isArray(value)) {
                output[key] = [...value.map(val => iterate(val))];
            } else {
                output[key] = iterate(value);
            }
        }
        return output;
    };
    return cloneDeep(iterate(root));
};

export function objectToMap(object) {
    return new Map(Object.entries(object));
}
