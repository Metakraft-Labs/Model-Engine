import { defineState } from "../../hyperflux";

// TODO: don't mix camera settings and follow camera settings
export const CameraSettingsState = defineState({
    name: "CameraSettingsState",
    initial: {
        fov: 60,
        cameraNearClip: 0.1,
        cameraFarClip: 1000,
        projectionType: "perspective",
        minCameraDistance: 1.5,
        maxCameraDistance: 50,
        startCameraDistance: 3,
        cameraMode: "Dynamic",
        cameraModeDefault: "ThirdPerson",
        minPhi: -70,
        maxPhi: 85,
    },
});
