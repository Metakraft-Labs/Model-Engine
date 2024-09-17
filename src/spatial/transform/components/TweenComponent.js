import { defineComponent } from "../../../ecs/ComponentFunctions";

export const TweenComponent = defineComponent({
    name: "TweenComponent",

    onInit(_entity) {
        return null;
    },

    onSet(_entity, component, json) {
        component.set(json);
    },
});
