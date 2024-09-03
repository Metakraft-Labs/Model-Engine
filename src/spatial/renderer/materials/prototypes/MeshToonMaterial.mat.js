import { MeshToonMaterial as Toon } from "three";

import {
    BasicArgs,
    DisplacementMapArgs,
    EmissiveMapArgs,
    NormalMapArgs,
} from "../constants/BasicArgs";
import { BoolArg } from "../constants/DefaultArgs";

export const MeshToonArguments = {
    ...BasicArgs,
    ...DisplacementMapArgs,
    ...EmissiveMapArgs,
    fog: BoolArg,
    gradientMap,
    ...NormalMapArgs,
};

export const MeshToonMaterial = {
    prototypeId: "MeshToonMaterial",
    prototypeConstructor: Toon,
    argumentsToonArguments,
};

export default MeshToonMaterial;
