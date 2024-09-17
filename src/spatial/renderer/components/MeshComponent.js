import { useEffect } from "react";
import { Mesh } from "three";

import { useEntityContext } from "../../../ecs";
import {
    defineComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { NO_PROXY, useImmediateEffect } from "../../../hyperflux";

import { useResource } from "../../resources/resourceHooks";
import { BoundingBoxComponent } from "../../transform/components/BoundingBoxComponents";
import { addObjectToGroup, removeObjectFromGroup } from "./GroupComponent";

export const MeshComponent = defineComponent({
    name: "MeshComponent",
    jsonID: "EE_mesh",

    onInit: _entity => null,

    onSet: (entity, component, mesh) => {
        if (!mesh || !mesh.isMesh) throw new Error("MeshComponent: Invalid mesh");
        component.set(mesh);
    },

    reactor: () => {
        const entity = useEntityContext();
        const meshComponent = useComponent(entity, MeshComponent);
        const [meshResource] = useResource(meshComponent.value, entity, meshComponent.uuid.value);
        const [geometryResource] = useResource(
            meshComponent.geometry.value,
            entity,
            meshComponent.geometry.uuid.value,
        );
        const [materialResource] = useResource(
            meshComponent.material.value,
            entity,
            !Array.isArray(meshComponent.material.value)
                ? meshComponent.material.value.uuid
                : undefined,
        );

        useEffect(() => {
            const box = geometryResource.boundingBox.get(NO_PROXY);
            if (!box) return;

            setComponent(entity, BoundingBoxComponent, { box: box });
            return () => {
                removeComponent(entity, BoundingBoxComponent);
            };
        }, [geometryResource.boundingBox]);

        useEffect(() => {
            if (meshComponent.value !== meshResource.value) meshResource.set(meshComponent.value);
        }, [meshComponent]);

        useEffect(() => {
            const mesh = meshComponent.value;
            if (mesh.geometry !== geometryResource.value) geometryResource.set(mesh.geometry);
        }, [meshComponent.geometry]);

        useEffect(() => {
            const mesh = meshComponent.value;
            if (mesh.material !== materialResource.value) materialResource.set(mesh.material);

            if (Array.isArray(mesh.material)) {
                for (const material of mesh.material) material.needsUpdate = true;
            } else {
                mesh.material.needsUpdate = true;
            }
        }, [meshComponent.material]);

        return null;
    },
});

/**
 *
 * Creates a mesh component that won't be exported
 *
 * @param entity entity to add the mesh component to
 * @param geometry a Geometry instance or function returing a Geometry instance to add to the mesh
 * @param material a Material instance or function returing a Material instance to add to the mesh
 * @returns State<Mesh>
 */
export function useMeshComponent(entity, geometry, material) {
    if (!hasComponent(entity, MeshComponent)) {
        const geo = typeof geometry === "function" ? geometry() : geometry;
        const mat = typeof material === "function" ? material() : material;
        setComponent(entity, MeshComponent, new Mesh() < TGeometry, TMaterial > (geo, mat));
    }

    const meshComponent = useComponent(entity, MeshComponent);

    useImmediateEffect(() => {
        const mesh = meshComponent.value;
        mesh.userData["ignoreOnExport"] = true;
        addObjectToGroup(entity, mesh);
        return () => {
            removeObjectFromGroup(entity, mesh);
            removeComponent(entity, MeshComponent);
        };
    }, []);

    return meshComponent;
}
