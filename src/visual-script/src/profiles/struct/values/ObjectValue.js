export const ObjectValue = {
    name: "object",
    creator: () => [],
    deserialize: value => (typeof value === "string" ? JSON.parse(value) : value),
    serialize: value => JSON.stringify(value),
    equals: (a, b) => a === b,
    clone: value => value,
    lerp: () => {
        throw new Error("Not implemented");
    },
};
