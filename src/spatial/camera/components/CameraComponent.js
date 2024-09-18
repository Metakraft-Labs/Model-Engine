import { ArrayCamera, PerspectiveCamera } from "three";

import { defineComponent } from "../../../ecs/ComponentFunctions";

import { addObjectToGroup, removeObjectFromGroup } from "../../renderer/components/GroupComponent";

export const CameraComponent = defineComponent({
    name: "CameraComponent",
    jsonID: "EE_camera",
    onInit: _entity => {
        const camera = new ArrayCamera();
        camera.fov = 60;
        camera.aspect = 1;
        camera.near = 0.1;
        camera.far = 1000;
        camera.cameras = [new PerspectiveCamera().copy(camera, false)];
        return camera;
    },
    onSet: (entity, component, json) => {
        addObjectToGroup(entity, component.value);
        if (!json) return;
        if (typeof json.fov === "number") component.fov.set(json.fov);
        if (typeof json.aspect === "number") component.fov.set(json.aspect);
        if (typeof json.near === "number") component.fov.set(json.near);
        if (typeof json.far === "number") component.fov.set(json.far);
    },
    onRemove: (entity, component) => {
        removeObjectFromGroup(entity, component.value);
    },
    toJSON: (_entity, component) => {
        return {
            fov: component.fov.value,
            aspect: component.aspect.value,
            near: component.near.value,
            far: component.far.value,
        };
    },
});
