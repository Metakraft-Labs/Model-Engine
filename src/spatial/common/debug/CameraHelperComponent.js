import { CameraHelper } from "three";

import { defineComponent, useComponent, useEntityContext } from "../../../ecs";
import { useDisposable } from "../../resources/resourceHooks";
import { useHelperEntity } from "./DebugComponentUtils";

export const CameraHelperComponent = defineComponent({
    name: "CameraHelperComponent",

    onInit: entity => {
        return {
            name: "camera-helper",
            camera,
            entity,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (!json.camera || !json.camera.isCamera)
            throw new Error("CameraHelperComponent: Valid Camera required");
        component.camera.set(json.camera);
        if (typeof json.name === "string") component.name.set(json.name);
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, CameraHelperComponent);
        const [helper] = useDisposable(CameraHelper, entity, component.camera.value);
        useHelperEntity(entity, component, helper);
        helper.update();

        return null;
    },
});
