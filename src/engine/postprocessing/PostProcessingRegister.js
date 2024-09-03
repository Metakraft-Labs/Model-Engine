import { Texture } from "@gltf-transform/core";
import {
    BlendFunction,
    EdgeDetectionMode,
    KernelSize,
    PredicationMode,
    SMAAPreset,
    VignetteTechnique,
} from "postprocessing";
import { Color, Vector2, Vector3 } from "three";

export const PropertyTypes = {
    BlendFunction,
    Number,
    Boolean,
    Color,
    ColorSpace: "ColorSpace",
    KernelSize,
    SMAAPreset,
    EdgeDetectionMode,
    PredicationMode,
    Texture,
    Vector2,
    Vector3,
    VignetteTechnique,
};
