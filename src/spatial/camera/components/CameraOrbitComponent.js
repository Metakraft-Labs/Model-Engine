import { Vector3 } from "three";
import { matches } from "../../../hyperflux";

import { defineComponent } from "../../../ecs";

export const CameraOrbitComponent = defineComponent({
    name: "CameraOrbitComponent",

    onInit: _entity => {
        return {
            focusedEntities: [],
            isPanning: false,
            cursorDeltaX: 0,
            cursorDeltaY: 0,
            minimumZoom: 0.1,
            isOrbiting: false,
            refocus: false,
            cameraOrbitCenter: new Vector3(),
            disabled: false,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (json.focusedEntities) component.focusedEntities.set(json.focusedEntities);
        if (matches.boolean.test(json.isPanning)) component.isPanning.set(json.isPanning);
        if (matches.number.test(json.cursorDeltaX)) component.cursorDeltaX.set(json.cursorDeltaX);
        if (matches.number.test(json.cursorDeltaY)) component.cursorDeltaY.set(json.cursorDeltaY);
        if (matches.number.test(json.minimumZoom)) component.minimumZoom.set(json.minimumZoom);
        if (matches.boolean.test(json.isOrbiting)) component.isOrbiting.set(json.isOrbiting);
        if (matches.boolean.test(json.refocus)) component.refocus.set(json.refocus);
        if (matches.boolean.test(json.disabled)) component.disabled.set(json.disabled);
    },
});
