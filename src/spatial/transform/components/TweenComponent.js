import { defineComponent } from "../../../ecs/ComponentFunctions";

export const TweenComponent = defineComponent({
    name: "TweenComponent",

    onInit(entity) {
        return null;
    },

    onSet(entity, component, json) {
        component.set(json);
    },
});
