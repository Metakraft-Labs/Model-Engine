export const StringValue = {
    name: "string",
    creator: () => "",
    deserialize: value => value,
    serialize: value => value,
    lerp: (start, end, t) => (t < 0.5 ? start : end),
    equals: (a, b) => a === b,
    clone: value => value,
};
