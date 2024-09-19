import { MeshBasicMaterial as Basic } from "three";

import {
    AoMapArgs,
    BasicArgs,
    EmissiveMapArgs,
    EnvMapArgs,
    LightMapArgs,
} from "../constants/BasicArgs";
import { TextureArg } from "../constants/DefaultArgs";

export const MeshBasicArguments = {
    ...BasicArgs,
    ...EmissiveMapArgs,
    ...LightMapArgs,
    ...AoMapArgs,
    ...EnvMapArgs,
    specularMap: TextureArg,
};

export const MeshBasicMaterial = {
    prototypeId: "MeshBasicMaterial",
    prototypeConstructor: Basic,
    arguments: MeshBasicArguments,
};

export default MeshBasicMaterial;
