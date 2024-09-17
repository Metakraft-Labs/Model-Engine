import { defineComponent } from "../../../ecs/ComponentFunctions";

export const CollisionComponent = defineComponent({
    name: "CollisionComponent",
    onInit(_entity) {
        return new Map();
    },
});
