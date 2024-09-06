import { equals } from "rambdax";

export const ListValue = {
    name: "list",
    creator: () => [],
    deserialize: value => (typeof value === "string" ? JSON.parse(value) : value),
    serialize: value => JSON.stringify(value),
    equals: (a, b) => equals(a, b),
    clone: value => value,
    lerp: value => {
        throw new Error("Not implemented");
    },
};
