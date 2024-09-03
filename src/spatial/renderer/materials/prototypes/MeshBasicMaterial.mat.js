import { MeshBasicMaterial as Basic } from "three";

import {
    AoMapArgs,
    BasicArgs,
    EmissiveMapArgs,
    EnvMapArgs,
    LightMapArgs,
} from "../constants/BasicArgs";

export const MeshBasicArguments = {
    ...BasicArgs,
    ...EmissiveMapArgs,
    ...LightMapArgs,
    ...AoMapArgs,
    ...EnvMapArgs,
    specularMap,
};

export const MeshBasicMaterial = {
    prototypeId: "MeshBasicMaterial",
    prototypeConstructor: Basic,
    argumentsBasicArguments,
};

export default MeshBasicMaterial;
