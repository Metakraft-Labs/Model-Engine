import { defineComponent, getComponent, hasComponent } from "../../../ecs";

import { NameComponent } from "../../common/NameComponent";

export const Object3DComponent = defineComponent({
    name: "Object3DComponent",
    jsonID: "EE_object3d",

    onInit: entity => null,
    onSet: (entity, component, object3d) => {
        if (!object3d || !object3d.isObject3D)
            throw new Error("Object3DComponent: Invalid object3d");
        if (hasComponent(entity, NameComponent))
            object3d.name = getComponent(entity, NameComponent);
        component.set(object3d);
    },
});
