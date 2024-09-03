import { Color, ShadowMaterial as Shadow } from "three";

import { BoolArg, ColorArg } from "../constants/DefaultArgs";

export const ShadowMaterialArguments = {
    color: { ...ColorArg, default: new Color("#000") },
    fog: { ...BoolArg, default: true },
    transparent: { ...BoolArg, default: true },
};

export const ShadowMaterial = {
    prototypeId: "ShadowMaterial",
    prototypeConstructor: Shadow,
    arguments: ShadowMaterialArguments,
};
