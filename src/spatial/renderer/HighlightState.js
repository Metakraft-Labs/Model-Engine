import { KernelSize, Resolution } from "postprocessing";

import { defineState } from "../../hyperflux";

import { BlendFunction } from "./effects/blending/BlendFunction";

export const HighlightState = defineState({
    name: "HighlightState",
    initial: {
        blendFunction: BlendFunction.SCREEN,
        patternTexture, // post processing args typed as (Texture ) so we must the type
        patternScale: 1.0,
        edgeStrength: 5.0,
        pulseSpeed: 0.0,
        visibleEdgeColor: 0xffffff,
        hiddenEdgeColor: 0x7777ff,
        kernelSize: KernelSize.MEDIUM,
        blur: true,
        xRay: true,
        multisampling: 0,
        resolutionScale: 0.5,
        resolutionX: Resolution.AUTO_SIZE,
        resolutionY: Resolution.AUTO_SIZE,
        width: Resolution.AUTO_SIZE,
        height: Resolution.AUTO_SIZE,
    },
});
