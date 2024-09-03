import { MeshPhongMaterial as Phong } from "three";

import {
    BasicArgs,
    BumpMapArgs,
    DisplacementMapArgs,
    EmissiveMapArgs,
    EnvMapArgs,
    NormalMapArgs,
} from "../constants/BasicArgs";
import { BoolArg, FloatArg } from "../constants/DefaultArgs";

export const MeshPhongArguments = {
    ...BasicArgs,
    ...BumpMapArgs,
    ...DisplacementMapArgs,
    dithering: { ...BoolArg, default: true },
    ...EmissiveMapArgs,
    ...NormalMapArgs,
    fog: BoolArg,
    ...EnvMapArgs,
    shininess: { ...FloatArg, default: 30 },
};

export const MeshPhongMaterial = {
    prototypeId: "MeshPhongMaterial",
    prototypeConstructor: Phong,
    argumentsPhongArguments,
};

export default MeshPhongMaterial;
