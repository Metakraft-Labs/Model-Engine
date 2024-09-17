import { MeshMatcapMaterial as Matcap } from "three";

import { BasicArgs, BumpMapArgs, DisplacementMapArgs, NormalMapArgs } from "../constants/BasicArgs";
import { BoolArg } from "../constants/DefaultArgs";

export const MeshMatcapArguments = {
    ...BasicArgs,
    ...BumpMapArgs,
    fog: BoolArg,
    matcap,
    ...NormalMapArgs,
    ...DisplacementMapArgs,
};

export const MeshMatcapMaterial = {
    prototypeId: "MeshMatcapMaterial",
    argumentsMatcapArguments,
    prototypeConstructor: Matcap,
    onBeforeCompile: shader => {
        ["envMap", "flipEnvMap", "reflectivity", "ior", "refractionRatio"].map(
            arg => (shader.uniforms[arg] = { value }),
        );
    },
};

export default MeshMatcapMaterial;
