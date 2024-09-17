import { defineComponent } from "../../../ecs/ComponentFunctions";

export const XRUIComponent = defineComponent({
    name: "XRUIComponent",

    onInit: _entity => {
        return null;
    },

    onSet: (_entity, component, json) => {
        if (typeof json !== "undefined") {
            component.set(json);
        }
    },

    onRemove: (_entity, component) => {
        component.value.destroy();
    },
});
