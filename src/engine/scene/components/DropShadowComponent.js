import { Vector3 } from "three";

import { defineComponent } from "../../../ecs/ComponentFunctions";
import { matches } from "../../../hyperflux";

export const DropShadowComponent = defineComponent({
    name: "DropShadowComponent",
    onInit: _entity => {
        return {
            radius: 0,
            center: new Vector3(),
            entity: 0,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.center)) component.center.set(json.center);
        if (matches.number.test(json.radius)) component.radius.set(json.radius);
        if (matches.number.test(json.entity)) component.entity.set(json.entity);
    },
});
