export const EntityValue = {
    name: "entity",
    creator: () => 0,
    deserialize: value => value,
    serialize: value => value,
    equals: (a, b) => a === b,
    clone: value => value,
    lerp: function (start, end, t) {
        throw new Error("Function not implemented.");
    },
};
