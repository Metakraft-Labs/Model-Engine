import { Vec3, vec3Equals, vec3Mix, vec3Parse } from "./internal/Vec3";

export const ColorValue = {
    name: "color",
    creator: () => new Vec3(),
    deserialize: value =>
        typeof value === "string" ? vec3Parse(value) : new Vec3(value[0], value[1], value[2]),
    serialize: value => [value.x, value.y, value.z],
    lerp: (start, end, t) => vec3Mix(start, end, t),
    equals: (a, b) => vec3Equals(a, b),
    clone: value => value.clone(),
};
