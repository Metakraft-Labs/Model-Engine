import {
    EPSILON,
    equalsTolerance,
    parseSafeFloats,
    toSafeString,
} from "../../../../VisualScriptModule";

export class Vec2 {
    constructor(x = 0, y = 0) {}

    clone(result = new Vec2()) {
        return result.set(this.x, this.y);
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
}

export function vec2Equals(a, b, tolerance = EPSILON) {
    return equalsTolerance(a.x, b.x, tolerance) && equalsTolerance(a.y, b.y, tolerance);
}
export function vec2Add(a, b, result = new Vec2()) {
    return result.set(a.x + b.x, a.y + b.y);
}
export function vec2Subtract(a, b, result = new Vec2()) {
    return result.set(a.x - b.x, a.y - b.y);
}
export function vec2MultiplyByScalar(a, b, result = new Vec2()) {
    return result.set(a.x * b, a.y * b);
}
export function vec2Negate(a, result = new Vec2()) {
    return result.set(-a.x, -a.y);
}
export function vec2Length(a) {
    return Math.sqrt(vec2Dot(a, a));
}
export function vec2Normalize(a, result = new Vec2()) {
    const invLength = 1 / vec2Length(a);
    return vec2MultiplyByScalar(a, invLength, result);
}
export function vec2Dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
export function vec2Mix(a, b, t, result = new Vec2()) {
    const s = 1 - t;
    return result.set(a.x * s + b.x * t, a.y * s + b.y * t);
}
export function vec2FromArray(array, offset = 0, result = new Vec2()) {
    return result.set(array[offset + 0], array[offset + 1]);
}
export function vec2ToArray(a, array, offset = 0) {
    array[offset + 0] = a.x;
    array[offset + 1] = a.y;
}

export function vec2ToString(a) {
    return toSafeString([a.x, a.y]);
}
export function vec2Parse(text, result = new Vec2()) {
    return vec2FromArray(parseSafeFloats(text), 0, result);
}
