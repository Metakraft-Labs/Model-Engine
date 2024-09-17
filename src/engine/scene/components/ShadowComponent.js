import { useEffect } from "react";

import { useEntityContext } from "../../../ecs";
import { defineComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { matches } from "../../../hyperflux";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";

export const ShadowComponent = defineComponent({
    name: "ShadowComponent",
    jsonID: "EE_shadow",

    onInit: _entity => {
        return {
            cast: true,
            receive: true,
        };
    },

    toJSON: (entity, component) => {
        return {
            cast: component.cast.value,
            receive: component.receive.value,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.boolean.test(json.cast)) component.cast.set(json.cast);
        if (matches.boolean.test(json.receive)) component.receive.set(json.receive);
    },

    reactor: () => {
        const entity = useEntityContext();
        const shadowComponent = useComponent(entity, ShadowComponent);
        const groupComponent = useComponent(entity, GroupComponent);

        useEffect(() => {
            for (const obj of groupComponent.value) {
                const object = obj;
                object.castShadow = shadowComponent.cast.value;
                object.receiveShadow = shadowComponent.receive.value;
            }
        }, [groupComponent, shadowComponent.cast, shadowComponent.receive]);

        return null;
    },
});
