import { Color } from "three";

export const BoolArg = { default: false, type: "boolean" };

export const FloatArg = { default: 0.0, type: "float" };
export const NormalizedFloatArg = { ...FloatArg, min: 0.0, max: 1.0 };

export const Vec2Arg = { default: [1, 1], type: "vec2" };
export const Vec3Arg = { default: [1, 1, 1], type: "vec3" };
export const ColorArg = { default: new Color(), type: "color" };

export const TextureArg = { default: null, type: "texture" };

export const SelectArg = { default: "", options: [], type: "select" };
export const StringArg = { default: "", type: "string" };
export const ShaderArg = { default: "", type: "shader" };

export const ObjectArg = { default: {}, type: "object" };

export function getDefaultType(value) {
    switch (typeof value) {
        case "boolean":
        case "string":
            return typeof value;
        case "number":
            return "float";
        case "object":
            if (value.isTexture) {
                return "texture";
            }
            if (value.isColor) {
                return "color";
            }
            if (value.isVector3) {
                return "vec3";
            }
            if (value.isVector2) {
                return "vec2";
            }
            if (value.isEuler) {
                return "euler";
            }
            if (value.isQuaternion || value.isVector4) {
                return "vec4";
            }
            return "";
        //todo: vectors, selects, objects
        default:
            return "";
    }
}

export function generateDefaults(value) {
    return Object.fromEntries(
        Object.entries(value)
            .filter(([_k, v]) => getDefaultType(v))
            .map(([k, v]) => {
                return [
                    k,
                    {
                        type: getDefaultType(v),
                        default: v,
                    },
                ];
            }),
    );
}
