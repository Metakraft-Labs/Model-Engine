import { useEffect } from "react";
import {
    defineComponent,
    hasComponent,
    removeComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { CallbackComponent, setCallback } from "../../../spatial/common/CallbackComponent";

export const SceneDynamicLoadTagComponent = defineComponent({
    name: "SceneDynamicLoadTagComponent",
    jsonID: "EE_dynamic_load",

    onInit(_entity) {
        return {
            mode: "distance",
            distance: 20,
            loaded: false,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (typeof json.mode === "string") component.mode.set(json.mode);
        if (typeof json.distance === "number") component.distance.set(json.distance);
        if (typeof json.loaded === "boolean") component.loaded.set(json.loaded);
    },

    toJSON: (_entity, component) => {
        return {
            mode: component.mode.value,
            distance: component.distance.value,
            loaded: component.loaded.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const component = useComponent(entity, SceneDynamicLoadTagComponent);

        /** Trigger mode */
        useEffect(() => {
            if (component.mode.value !== "trigger") return;

            function doLoad() {
                component.loaded.set(true);
            }

            function doUnload() {
                component.loaded.set(false);
            }

            if (hasComponent(entity, CallbackComponent)) {
                removeComponent(entity, CallbackComponent);
            }

            setCallback(entity, "doLoad", doLoad);
            setCallback(entity, "doUnload", doUnload);

            return () => {
                removeComponent(entity, CallbackComponent);
            };
        }, [component.mode]);

        return null;
    },
});
