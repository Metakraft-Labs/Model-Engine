import { defineComponent } from "../../../ecs/ComponentFunctions";

export const BoneComponent = defineComponent({
    name: "BoneComponent",

    onInit: _entity => null,

    onSet: (entity, component, mesh) => {
        if (!mesh || !mesh.isBone) throw new Error("BoneComponent: Invalid bone");
        component.set(mesh);
    },
});
