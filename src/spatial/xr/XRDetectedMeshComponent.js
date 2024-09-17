import { useEffect } from "react";
import { BufferAttribute, BufferGeometry, Mesh } from "three";
import matches from "ts-matches";

import { defineComponent, setComponent, useComponent } from "../../ecs/ComponentFunctions";
import { Engine } from "../../ecs/Engine";
import { createEntity, useEntityContext } from "../../ecs/EntityFunctions";
import { getMutableState, getState, useHookstate } from "../../hyperflux";
import { EntityTreeComponent } from "../../spatial/transform/components/EntityTree";

import { NameComponent } from "../common/NameComponent";
import { addObjectToGroup, removeObjectFromGroup } from "../renderer/components/GroupComponent";
import { setVisibleComponent } from "../renderer/components/VisibleComponent";
import { TransformComponent } from "../transform/components/TransformComponent";
import { occlusionMat, placementHelperMaterial, shadowMaterial } from "./XRDetectedPlaneComponent";
import { ReferenceSpace, XRState } from "./XRState";

export const XRDetectedMeshComponent = defineComponent({
    name: "XRDetectedMeshComponent",

    onInit(_entity) {
        return {
            mesh,
            // internal
            shadowMesh,
            occlusionMesh,
            geometry,
            placementHelper,
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;
        if (matches.object.test(json.mesh)) {
            component.mesh.set(json.mesh);
        }
        if (matches.object.test(json.geometry)) {
            component.geometry.value?.dispose?.();
            component.geometry.set(json.geometry);
        }
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, XRDetectedMeshComponent);
        const scenePlacementMode = useHookstate(getMutableState(XRState).scenePlacementMode);

        useEffect(() => {
            if (!component.mesh.value) return;

            const geometry = XRDetectedMeshComponent.createGeometryFromMesh(component.mesh.value);
            component.geometry.set(geometry);

            const shadowMesh = new Mesh(geometry, shadowMaterial);
            const occlusionMesh = new Mesh(geometry, occlusionMat);
            const placementHelper = new Mesh(geometry, placementHelperMaterial);

            addObjectToGroup(entity, shadowMesh);
            addObjectToGroup(entity, occlusionMesh);
            addObjectToGroup(entity, placementHelper);
            occlusionMesh.renderOrder =
                -1; /** @todo make a global config for AR occlusion mesh renderOrder */

            component.shadowMesh.set(shadowMesh);
            component.occlusionMesh.set(occlusionMesh);
            component.placementHelper.set(placementHelper);

            return () => {
                removeObjectFromGroup(entity, shadowMesh);
                removeObjectFromGroup(entity, occlusionMesh);
                removeObjectFromGroup(entity, placementHelper);
            };
        }, [component.mesh]);

        useEffect(() => {
            const shadowMesh = component.shadowMesh.value;
            const occlusionMesh = component.occlusionMesh.value;
            const geometry = component.geometry.value;

            if (shadowMesh.geometry) shadowMesh.geometry = geometry;
            if (occlusionMesh.geometry) occlusionMesh.geometry = geometry;

            return () => {
                geometry.dispose();
            };
        }, [component.geometry]);

        useEffect(() => {
            const placementHelper = component.placementHelper.value;
            placementHelper.visible = scenePlacementMode.value === "placing";
        }, [scenePlacementMode]);

        return null;
    },

    createGeometryFromMesh: mesh => {
        const geometry = new BufferGeometry();

        const vertices = mesh.vertices;
        const indices = mesh.indices;

        geometry.setAttribute("position", new BufferAttribute(vertices, 3));
        geometry.setIndex(new BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        return geometry;
    },

    updateMeshGeometry: (entity, mesh) => {
        XRDetectedMeshComponent.meshesLastChangedTimes.set(mesh, mesh.lastChangedTime);
        // const geometry = XRDetectedMeshComponent.createGeometryFromMesh(mesh);
    },

    updateMeshPose: (entity, mesh) => {
        const planePose = getState(XRState).xrFrame.getPose(
            mesh.meshSpace,
            ReferenceSpace.localFloor,
        );
        if (!planePose) return;
        TransformComponent.position.x[entity] = planePose.transform.position.x;
        TransformComponent.position.y[entity] = planePose.transform.position.y;
        TransformComponent.position.z[entity] = planePose.transform.position.z;
        TransformComponent.rotation.x[entity] = planePose.transform.orientation.x;
        TransformComponent.rotation.y[entity] = planePose.transform.orientation.y;
        TransformComponent.rotation.z[entity] = planePose.transform.orientation.z;
        TransformComponent.rotation.w[entity] = planePose.transform.orientation.w;
    },

    foundMesh: mesh => {
        const entity = createEntity();
        setComponent(entity, EntityTreeComponent, {
            parentEntity: Engine.instance.localFloorEntity,
        });
        setComponent(entity, TransformComponent);
        setVisibleComponent(entity, true);
        setComponent(entity, XRDetectedMeshComponent);
        setComponent(entity, NameComponent, "mesh-" + planeId++);

        XRDetectedMeshComponent.meshesLastChangedTimes.set(mesh, mesh.lastChangedTime);
        XRDetectedMeshComponent.updateMeshPose(entity, mesh);

        setComponent(entity, XRDetectedMeshComponent, { mesh: mesh });

        XRDetectedMeshComponent.detectedMeshesMap.set(mesh, entity);
    },
    detectedMeshesMap: new Map(),
    meshesLastChangedTimes: new Map(),
});

let planeId = 0;
