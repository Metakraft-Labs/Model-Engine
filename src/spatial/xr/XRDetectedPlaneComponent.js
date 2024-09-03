import { useEffect } from "react";
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, ShadowMaterial } from "three";
import matches from "ts-matches";

import {
    defineComponent,
    getMutableComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../ecs/ComponentFunctions";
import { Engine } from "../../ecs/Engine";
import { createEntity, useEntityContext } from "../../ecs/EntityFunctions";
import { getMutableState, getState, none, useHookstate } from "../../hyperflux";
import { EntityTreeComponent } from "../../spatial/transform/components/EntityTree";

import { NameComponent } from "../common/NameComponent";
import { addObjectToGroup, removeObjectFromGroup } from "../renderer/components/GroupComponent";
import { MeshComponent } from "../renderer/components/MeshComponent";
import { setVisibleComponent } from "../renderer/components/VisibleComponent";
import { TransformComponent } from "../transform/components/TransformComponent";
import { ReferenceSpace, XRState } from "./XRState";

export const placementHelperMaterial = new MeshBasicMaterial({
    color: "grey",
    wireframe: false,
    opacity: 0.5,
    transparent: true,
});
export const shadowMaterial = new ShadowMaterial({ opacity: 0.5, color: 0x0a0a0a });
shadowMaterial.polygonOffset = true;
shadowMaterial.polygonOffsetFactor = -0.01;
export const occlusionMat = new MeshBasicMaterial({ colorWrite: false });
occlusionMat.polygonOffset = true;
occlusionMat.polygonOffsetFactor = -0.01;

export const XRDetectedPlaneComponent = defineComponent({
    name: "XRDetectedPlaneComponent",

    onInit(entity) {
        return {
            plane,
            // internal
            shadowMesh,
            occlusionMesh,
            geometry,
            placementHelper,
        };
    },

    onSet(entity, component, json) {
        if (!json) return;
        if (matches.object.test(json.plane)) {
            component.plane.set(json.plane);
        }
        if (matches.object.test(json.geometry)) {
            component.geometry.value?.dispose?.();
            component.geometry.set(json.geometry);
        }
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, XRDetectedPlaneComponent);
        const scenePlacementMode = useHookstate(getMutableState(XRState).scenePlacementMode);

        useEffect(() => {
            if (!component.plane.value) return;

            const geometry = XRDetectedPlaneComponent.createGeometryFromPolygon(
                component.plane.value,
            );

            XRDetectedPlaneComponent.updatePlanePose(entity, component.plane.value);
            component.geometry.set(geometry);

            const shadowMesh = new Mesh(geometry, shadowMaterial);

            const occlusionMesh = new Mesh(geometry, occlusionMat);

            const placementHelper = new Mesh(geometry, placementHelperMaterial);

            setComponent(entity, MeshComponent, shadowMesh);

            addObjectToGroup(entity, shadowMesh);
            addObjectToGroup(entity, occlusionMesh);
            addObjectToGroup(entity, placementHelper);
            occlusionMesh.renderOrder =
                -1; /** @todo make a global config for AR occlusion mesh renderOrder */

            component.shadowMesh.set(shadowMesh);
            component.occlusionMesh.set(occlusionMesh);
            component.placementHelper.set(placementHelper);

            return () => {
                removeComponent(entity, MeshComponent);

                removeObjectFromGroup(entity, shadowMesh);
                removeObjectFromGroup(entity, occlusionMesh);
                removeObjectFromGroup(entity, placementHelper);

                if (!hasComponent(entity, XRDetectedPlaneComponent)) return;

                component.shadowMesh.set(none);
                component.occlusionMesh.set(none);
                component.placementHelper.set(none);
            };
        }, [component.plane]);

        useEffect(() => {
            const geometry = component.geometry.value;

            if (component.shadowMesh.value) component.shadowMesh.geometry.set(geometry);
            if (component.occlusionMesh.value) component.occlusionMesh.geometry.set(geometry);

            return () => {
                geometry.dispose();
            };
        }, [component.geometry]);

        useEffect(() => {
            const placementHelper = component.placementHelper;
            placementHelper.visible.set(scenePlacementMode.value === "placing");
        }, [scenePlacementMode]);

        return null;
    },

    createGeometryFromPolygon: plane => {
        const geometry = new BufferGeometry();
        const polygon = plane.polygon;

        const vertices = [];
        const uvs = [];

        for (const point of polygon) {
            vertices.push(point.x, point.y, point.z);
            uvs.push(point.x, point.z);
        }

        const indices = [];
        for (let i = 2; i < polygon.length; ++i) {
            indices.push(0, i - 1, i);
        }

        geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        return geometry;
    },

    updatePlaneGeometry: (entity, plane) => {
        XRDetectedPlaneComponent.planesLastChangedTimes.set(plane, plane.lastChangedTime);
        const geometry = XRDetectedPlaneComponent.createGeometryFromPolygon(plane);
        getMutableComponent(entity, XRDetectedPlaneComponent).geometry.set(geometry);
    },

    updatePlanePose: (entity, plane) => {
        const planePose = getState(XRState).xrFrame.getPose(
            plane.planeSpace,
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

    foundPlane: plane => {
        const entity = createEntity();
        setComponent(entity, EntityTreeComponent, {
            parentEntity: Engine.instance.localFloorEntity,
        });
        setComponent(entity, TransformComponent);
        setVisibleComponent(entity, true);
        setComponent(entity, XRDetectedPlaneComponent, { plane });
        setComponent(entity, NameComponent, "plane-" + planeId++);

        XRDetectedPlaneComponent.planesLastChangedTimes.set(plane, plane.lastChangedTime);
        XRDetectedPlaneComponent.detectedPlanesMap.set(plane, entity);
    },
    detectedPlanesMap: new Map(),
    planesLastChangedTimes: new Map(),
});

let planeId = 0;
