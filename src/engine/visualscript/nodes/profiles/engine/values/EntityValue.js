export const EntityValue = {
    name: "entity",
    creator: () => 0,
    deserialize: value => value,
    serialize: value => value,
    equals: (a, b) => a === b,
    clone: value => value,
    lerp: function (_start, _end, _t) {
        throw new Error("Function not implemented.");
    },
};
