import { defineComponent } from "../../../ecs/ComponentFunctions";

export const CollisionComponent = defineComponent({
    name: "CollisionComponent",
    onInit(entity) {
        return new Map();
    },
});
