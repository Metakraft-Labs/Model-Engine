import { defineComponent } from "../../../ecs/ComponentFunctions";

export const GLTFLoadedComponent = defineComponent({
    name: "GLTFLoadedComponent",

    onInit: entity => {
        return [];
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (Array.isArray(json)) {
            component.set(json);
        }
    },
});
