import { defineComponent } from "../../../ecs/ComponentFunctions";

export const AvatarPendingComponent = defineComponent({
    name: "AvatarPendingComponent",

    onInit(_entity) {
        return {
            url: "",
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (json.url) component.url.set(json.url);
    },
});
