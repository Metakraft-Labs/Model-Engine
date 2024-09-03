import { defineComponent } from "../../../ecs/ComponentFunctions";

export const AvatarTeleportComponent = defineComponent({
    name: "AvatarTeleportComponent",

    onInit: entity => {
        return {
            side,
        };
    },

    onSet: (entity, component, json) => {
        if (typeof json?.side === "string") component.side.set(json.side);
    },

    toJSON: () => {
        return null;
    },
});
