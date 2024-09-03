import { MeshStandardMaterial as Standard } from "three";

import {
    AoMapArgs,
    BasicArgs,
    BumpMapArgs,
    DisplacementMapArgs,
    EmissiveMapArgs,
    EnvMapArgs,
    LightMapArgs,
    MetalnessMapArgs,
    NormalMapArgs,
    RoughhnessMapArgs,
} from "../constants/BasicArgs";

export const MeshStandardArguments = {
    ...BasicArgs,
    ...EmissiveMapArgs,
    ...EnvMapArgs,
    ...NormalMapArgs,
    ...BumpMapArgs,
    ...DisplacementMapArgs,
    ...RoughhnessMapArgs,
    ...MetalnessMapArgs,
    ...AoMapArgs,
    ...LightMapArgs,
};

export const MeshStandardMaterial = {
    prototypeId: "MeshStandardMaterial",
    prototypeConstructor: Standard,
    argumentsStandardArguments,
};

export default MeshStandardMaterial;
