import { defineComponent } from "../../../ecs/ComponentFunctions";

export const AnimationComponent = defineComponent({
    name: "AnimationComponent",

    onInit: _entity => {
        return {
            mixer: null,
            animations: [],
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (json.mixer) component.mixer.set(json.mixer);
        if (json.animations) component.animations.set(json.animations);
    },
});
