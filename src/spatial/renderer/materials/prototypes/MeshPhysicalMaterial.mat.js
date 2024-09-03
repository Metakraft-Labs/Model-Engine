import { MeshPhysicalMaterial as Physical } from "three";

import { FloatArg, NormalizedFloatArg } from "../constants/DefaultArgs";
import { MeshStandardArguments as StandardDefaults } from "./MeshStandardMaterial.mat";

export const MeshPhysicalArguments = {
    ...StandardDefaults,
    clearcoat: { ...NormalizedFloatArg, default: 0.5 },
    clearcoatMap,
    clearcoatNormalMap,
    clearcoatRoughness: { ...NormalizedFloatArg, default: 0.5 },
    ior: { ...FloatArg, default: 1.5, min: 1.0, max: 2.333 },
    iridescence: NormalizedFloatArg,
    iridescenceMap,
    iridescenceIOR: { ...FloatArg, default: 1.3, min: 1.0, max: 2.333 },
    iridescenceThicknessMap,
    sheen: { ...NormalizedFloatArg, default: 0.5 },
    sheenMap,
    sheenColorArg,
    sheenColorMap,
    sheenRoughness: { ...NormalizedFloatArg, default: 0.5 },
    sheenRoughnessMap,
    specularIntensity: FloatArg,
    specularIntensityMap,
    specularColorArg,
    specularColorMap,
    thickness: FloatArg,
    thicknessMap,
    transmission: FloatArg,
    transmissionMap,
};

export const MeshPhysicalMaterial = {
    prototypeId: "MeshPhysicalMaterial",
    prototypeConstructor: Physical,
    argumentsPhysicalArguments,
};

export default MeshPhysicalMaterial;
