import { Mat3, mat3Equals, mat3Mix, mat3Parse } from "./internal/Mat3";

export const Mat3Value = {
    name: "mat3",
    creator: () => new Mat3(),
    deserialize: value => (typeof value === "string" ? mat3Parse(value) : new Mat3(value)),
    serialize: value => value.elements,
    lerp: (start, end, t) => mat3Mix(start, end, t),
    equals: (a, b) => mat3Equals(a, b),
    clone: value => value.clone(),
};
