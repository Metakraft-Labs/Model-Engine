import { defineState, syncStateWithLocalStorage } from "../../hyperflux";

import { isIPhone } from "../common/functions/isMobile";
import { RenderModes } from "./constants/RenderModes";

export const RendererState = defineState({
    name: "RendererState",
    initial: () => ({
        qualityLevel: isIPhone ? 2 : 5, // range from 0 to 5
        automatic: isIPhone ? false : true,
        // usePBR: true,
        usePostProcessing: isIPhone ? false : true,
        useShadows: isIPhone ? false : true,
        updateCSMFrustums: true,
        /** Resoulion scale. **Default** value is 1. */
        renderScale: 1,
        physicsDebug: false,
        bvhDebug: false,
        avatarDebug: false,
        renderMode: RenderModes.SHADOW,
        nodeHelperVisibility: false,
        gridVisibility: false,
        gridHeight: 0,
        forceBasicMaterials: false,
        shadowMapResolution: isIPhone ? 256 : 2048,
        infiniteGridHelperEntity,
    }),
    extension: syncStateWithLocalStorage([
        "qualityLevel",
        "automatic",
        // 'usePBR',
        "usePostProcessing",
        "useShadows",
        "physicsDebug",
        "bvhDebug",
        "avatarDebug",
        "renderMode",
        "nodeHelperVisibility",
        "gridVisibility",
        "gridHeight",
    ]),
});
