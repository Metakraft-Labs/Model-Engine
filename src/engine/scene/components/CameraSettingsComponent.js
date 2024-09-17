import { useEffect } from "react";

import { defineComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, getState } from "../../../hyperflux";
import { CameraSettingsState } from "../../../spatial/camera/CameraSceneMetadata";

export const CameraSettingsComponent = defineComponent({
    name: "CameraSettingsComponent",
    jsonID: "EE_camera_settings",

    onInit(_entity) {
        return typeof CameraSettingsState.initial === "function"
            ? CameraSettingsState.initial()
            : JSON.parse(JSON.stringify(CameraSettingsState.initial));
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (typeof json.fov === "number") component.fov.set(json.fov);
        if (typeof json.cameraNearClip === "number")
            component.cameraNearClip.set(json.cameraNearClip);
        if (typeof json.cameraFarClip === "number") component.cameraFarClip.set(json.cameraFarClip);
        if (typeof json.projectionType === "number")
            component.projectionType.set(json.projectionType);
        if (typeof json.minCameraDistance === "number")
            component.minCameraDistance.set(Math.max(json.minCameraDistance, 1.5));
        if (typeof json.maxCameraDistance === "number")
            component.maxCameraDistance.set(json.maxCameraDistance);
        if (typeof json.startCameraDistance === "number")
            component.startCameraDistance.set(json.startCameraDistance);
        if (typeof json.cameraMode === "number") component.cameraMode.set(json.cameraMode);
        if (typeof json.cameraModeDefault === "number")
            component.cameraModeDefault.set(json.cameraModeDefault);
        if (typeof json.minPhi === "number") component.minPhi.set(json.minPhi);
        if (typeof json.maxPhi === "number") component.maxPhi.set(json.maxPhi);
    },

    toJSON: (entity, component) => {
        return {
            fov: component.fov.value,
            cameraNearClip: component.cameraNearClip.value,
            cameraFarClip: component.cameraFarClip.value,
            projectionType: component.projectionType.value,
            minCameraDistance: component.minCameraDistance.value,
            maxCameraDistance: component.maxCameraDistance.value,
            startCameraDistance: component.startCameraDistance.value,
            cameraMode: component.cameraMode.value,
            cameraModeDefault: component.cameraModeDefault.value,
            minPhi: component.minPhi.value,
            maxPhi: component.maxPhi.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const component = useComponent(entity, CameraSettingsComponent);

        for (const prop of Object.keys(getState(CameraSettingsState))) {
            useEffect(() => {
                if (component[prop].value !== getState(CameraSettingsState)[prop])
                    getMutableState(CameraSettingsState)[prop].set(component[prop].value);
            }, [component[prop]]);
        }

        return null;
    },
});
