import { defineComponent } from "../../../ecs/ComponentFunctions";

export const GLTFLoadedComponent = defineComponent({
    name: "GLTFLoadedComponent",

    onInit: _entity => {
        return [];
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (Array.isArray(json)) {
            component.set(json);
        }
    },
});
