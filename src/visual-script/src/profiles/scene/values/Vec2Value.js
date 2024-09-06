import { Vec2, vec2Mix, vec2Parse } from "./internal/Vec2";

export const Vec2Value = {
    name: "vec2",
    creator: () => new Vec2(),
    deserialize: value =>
        typeof value === "string" ? vec2Parse(value) : new Vec2(value[0], value[1]),
    serialize: value => [value.x, value.y],
    lerp: (start, end, t) => vec2Mix(start, end, t),
    equals: (a, b) => a.x === b.x && a.y === b.y,
    clone: value => value.clone(),
};
