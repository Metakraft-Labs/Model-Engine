import { defineComponent } from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";

export const SittingComponent = defineComponent({
    name: "SittingComponent",

    onInit(_entity) {
        return {
            mountPointEntity: UndefinedEntity,
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;

        if (typeof json.mountPointEntity === "number")
            component.mountPointEntity.set(json.mountPointEntity);
        //if (typeof json.state === 'string') component.state.set(json.state)
    },
});
