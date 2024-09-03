import { defineComponent } from "../../../ecs/ComponentFunctions";

export const XRUIComponent = defineComponent({
    name: "XRUIComponent",

    onInit: entity => {
        return null;
    },

    onSet: (entity, component, json) => {
        if (typeof json !== "undefined") {
            component.set(json);
        }
    },

    onRemove: (entity, component) => {
        component.value.destroy();
    },
});
