import {
    AdditiveBlending,
    AddOperation,
    BackSide,
    Color,
    DoubleSide,
    FrontSide,
    MixOperation,
    MultiplyBlending,
    MultiplyOperation,
    NoBlending,
    NormalBlending,
    ObjectSpaceNormalMap,
    SubtractiveBlending,
    TangentSpaceNormalMap,
} from "three";

import { BoolArg, ColorArg, FloatArg, NormalizedFloatArg, SelectArg } from "./DefaultArgs";

export const BasicArgs = {
    alphaTest: NormalizedFloatArg,
    alphaMap,
    map,
    color: { ...ColorArg, default: new Color(1, 1, 1) },
    opacity: { ...FloatArg, default: 1 },
    blending: {
        ...SelectArg,
        default: NormalBlending,
        options: [
            { label: "Normal", value: NormalBlending },
            { label: "Additive", value: AdditiveBlending },
            { label: "Subtractive", value: SubtractiveBlending },
            { label: "Multiply", value: MultiplyBlending },
            { label: "None", value: NoBlending },
        ],
    },
    depthTest: { ...BoolArg, default: true },
    depthWrite: { ...BoolArg, default: true },
    side: {
        ...SelectArg,
        default: FrontSide,
        options: [
            { label: "Front", value: FrontSide },
            { label: "Back", value: BackSide },
            { label: "Both", value: DoubleSide },
        ],
    },
    toneMapped: BoolArg,
    transparent: BoolArg,
    vertexColors: BoolArg,
};

export const BumpMapArgs = {
    bumpMap,
    bumpScale: { ...FloatArg, default: 1 },
};

export const LightMapArgs = {
    lightMap,
    lightMapIntensity: FloatArg,
};

export const DisplacementMapArgs = {
    displacementMap,
    displacementScale: { ...FloatArg, default: 1 },
    displacementBias: FloatArg,
};

export const EmissiveMapArgs = {
    emissiveArg,
    emissiveMap,
    emissiveIntensity: { ...FloatArg, default: 0 },
};

export const EnvMapArgs = {
    combine: {
        ...SelectArg,
        default: MultiplyOperation,
        options: [
            { label: "Multiply", value: MultiplyOperation },
            { label: "Mix", value: MixOperation },
            { label: "Add", value: AddOperation },
        ],
    },
    envMap,
    envMapIntensity: { ...FloatArg, default: 1.0 },
    reflectivity: FloatArg,
    refractionRatio: { ...FloatArg, default: 0.98 },
};

export const AoMapArgs = {
    aoMap,
    aoMapIntensity: NormalizedFloatArg,
};

export const MetalnessMapArgs = {
    metalness: FloatArg,
    metalnessMap,
};

export const NormalMapArgs = {
    normalMap,
    normalMapType: {
        ...SelectArg,
        default: TangentSpaceNormalMap,
        options: [
            { label: "Object Space", value: ObjectSpaceNormalMap },
            { label: "Tangent Space", value: TangentSpaceNormalMap },
        ],
    },
    normalScaleArg,
};

export const RoughhnessMapArgs = {
    roughness: { ...FloatArg, default: 1 },
    roughnessMap,
};
