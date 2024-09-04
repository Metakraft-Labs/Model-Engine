import { ValueType } from "../../../VisualScriptModule";

export const ObjectValue = {
    name: "object",
    creator: () => [],
    deserialize: (value | object) =>
        typeof value === "string" ? JSON.parse(value) : value,
    serialize: (value: object) => JSON.stringify(value),
    equals: (a, b) => a === b,
    clone: (value: object) => value,
    lerp: (value: object) => {
        throw new Error("Not implemented");
    },
};
