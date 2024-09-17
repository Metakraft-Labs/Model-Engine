import { defineComponent } from "../../../ecs/ComponentFunctions";

export const SkinnedMeshComponent = defineComponent({
    name: "SkinnedMeshComponent",

    onInit: _entity => null,

    onSet: (entity, component, mesh) => {
        if (!mesh || !mesh.isSkinnedMesh)
            throw new Error("SkinnedMeshComponent: Invalid skinned mesh");
        component.set(mesh);
    },
});
