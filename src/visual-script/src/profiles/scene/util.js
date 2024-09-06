import { Quaternion, Vector3, Vector4 } from "three";

import { Vec3 } from "./values/internal/Vec3";
import { Vec4 } from "./values/internal/Vec4";

export function toVec3(value) {
    return new Vec3(value.x, value.y, value.z);
}

export function toVec4(value) {
    return new Vec4(value.x, value.y, value.z, value.w);
}

export function toVector3(value) {
    return value ? new Vector3(value.x, value.y, value.z) : null;
}

export function toVector4(value) {
    return value ? new Vector4(value.x, value.y, value.z, value.w) : null;
}

export function toQuat(value) {
    return value ? new Quaternion(value.x, value.y, value.z, value.w) : null;
}
