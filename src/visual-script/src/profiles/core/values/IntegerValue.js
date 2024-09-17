export const IntegerValue = {
    name: "integer",
    creator: () => BigInt(0),
    deserialize: value => BigInt(value),
    serialize: value =>
        Number.MIN_SAFE_INTEGER <= value && value <= Number.MAX_SAFE_INTEGER
            ? Number(value)
            : value.toString(), // prefer string to ensure full range is covered

    lerp: (start, end, t) => BigInt(Number(start) * (1 - t) + Number(end) * t),
    equals: (a, b) => a === b,
    clone: value => value,
};
