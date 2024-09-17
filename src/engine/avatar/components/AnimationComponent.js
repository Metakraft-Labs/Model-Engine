import { defineComponent } from "../../../ecs/ComponentFunctions";

export const AnimationComponent = defineComponent({
    name: "AnimationComponent",

    onInit: _entity => {
        return {
            mixer,
            animations: [],
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (json.mixer) component.mixer.set(json.mixer);
        if (json.animations) component.animations.set(json.animations);
    },
});
