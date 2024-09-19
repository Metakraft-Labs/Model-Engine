import { MeshToonMaterial as Toon } from "three";

import {
    BasicArgs,
    DisplacementMapArgs,
    EmissiveMapArgs,
    NormalMapArgs,
} from "../constants/BasicArgs";
import { BoolArg, TextureArg } from "../constants/DefaultArgs";

export const MeshToonArguments = {
    ...BasicArgs,
    ...DisplacementMapArgs,
    ...EmissiveMapArgs,
    fog: BoolArg,
    gradientMap: TextureArg,
    ...NormalMapArgs,
};

export const MeshToonMaterial = {
    prototypeId: "MeshToonMaterial",
    prototypeConstructor: Toon,
    arguments: MeshToonArguments,
};

export default MeshToonMaterial;
