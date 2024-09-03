import { AxesHelper } from "three";

import { defineComponent, useComponent, useEntityContext } from "../../../ecs";
import { ObjectLayerMasks } from "../../../spatial/renderer/constants/ObjectLayers";
import { useDisposable } from "../../resources/resourceHooks";
import { useHelperEntity } from "./DebugComponentUtils";

export const AxesHelperComponent = defineComponent({
    name: "AxesHelperComponent",

    onInit: entity => {
        return {
            name: "axes-helper",
            size: 1,
            layerMask: ObjectLayerMasks.NodeHelper,
            entity,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (typeof json.name === "string") component.name.set(json.name);
        if (typeof json.size === "number") component.size.set(json.size);
        if (typeof json.layerMask === "number") component.layerMask.set(json.layerMask);
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, AxesHelperComponent);
        const [helper] = useDisposable(AxesHelper, entity, component.size.value);
        useHelperEntity(entity, component, helper, component.layerMask.value);

        return null;
    },
});
