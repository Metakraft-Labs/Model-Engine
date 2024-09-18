import { defineComponent } from "../../../ecs/ComponentFunctions";

export const AvatarTeleportComponent = defineComponent({
    name: "AvatarTeleportComponent",

    onInit: _entity => {
        return {
            side,
        };
    },

    onSet: (_entity, component, json) => {
        if (typeof json?.side === "string") component.side.set(json.side);
    },

    toJSON: () => {
        return null;
    },
});
