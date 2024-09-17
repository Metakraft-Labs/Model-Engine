import { useEffect } from "react";
import { Box3, BufferGeometry, LineBasicMaterial, Matrix4, Quaternion, Vector3 } from "three";
import {
    defineComponent,
    getComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { useDidMount } from "../../../hooks/useDidMount";
import { getMutableState, useState } from "../../../hyperflux";
import { EngineState } from "../../../spatial/EngineState";
import { Vector3_Zero } from "../../../spatial/common/constants/MathConstants";
import { useHelperEntity } from "../../../spatial/common/debug/DebugComponentUtils";
import { matchesColor } from "../../../spatial/common/functions/MatchesUtils";
import { LineSegmentComponent } from "../../../spatial/renderer/components/LineSegmentComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { ObjectLayerMasks } from "../../../spatial/renderer/constants/ObjectLayers";
import {
    EntityTreeComponent,
    iterateEntityNode,
    useChildrenWithComponent,
} from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { computeTransformMatrix } from "../../../spatial/transform/systems/TransformSystem";
import { ModelComponent } from "./ModelComponent";

function createBBoxGridGeometry(matrixWorld, bbox, density) {
    const lineSegmentList = [];
    const size = new Vector3();
    bbox.getSize(size);

    // Create grid lines for each face of the bounding box

    // Front and back faces (parallel to XY plane)
    const zFront = bbox.min.z;
    const zBack = bbox.max.z;
    for (let j = 0; j <= density; j++) {
        const segmentFraction = j / density;
        const x = bbox.min.x + segmentFraction * size.x;
        const y = bbox.min.y + segmentFraction * size.y;

        lineSegmentList.push(
            new Vector3(x, bbox.min.y, zFront),
            new Vector3(x, bbox.max.y, zFront),
        );
        lineSegmentList.push(new Vector3(x, bbox.min.y, zBack), new Vector3(x, bbox.max.y, zBack));
        lineSegmentList.push(
            new Vector3(bbox.min.x, y, zFront),
            new Vector3(bbox.max.x, y, zFront),
        );
        lineSegmentList.push(new Vector3(bbox.min.x, y, zBack), new Vector3(bbox.max.x, y, zBack));
    }

    // Top and bottom faces (parallel to XZ plane)
    const yTop = bbox.max.y;
    const yBottom = bbox.min.y;
    for (let j = 0; j <= density; j++) {
        const segmentFraction = j / density;
        const x = bbox.min.x + segmentFraction * size.x;
        const z = bbox.min.z + segmentFraction * size.z;

        lineSegmentList.push(new Vector3(x, yTop, bbox.min.z), new Vector3(x, yTop, bbox.max.z));
        lineSegmentList.push(
            new Vector3(x, yBottom, bbox.min.z),
            new Vector3(x, yBottom, bbox.max.z),
        );
        lineSegmentList.push(new Vector3(bbox.min.x, yTop, z), new Vector3(bbox.max.x, yTop, z));
        lineSegmentList.push(
            new Vector3(bbox.min.x, yBottom, z),
            new Vector3(bbox.max.x, yBottom, z),
        );
    }

    // Left and right faces (parallel to YZ plane)
    const xLeft = bbox.min.x;
    const xRight = bbox.max.x;
    for (let j = 0; j <= density; j++) {
        const segmentFraction = j / density;
        const y = bbox.min.y + segmentFraction * size.y;
        const z = bbox.min.z + segmentFraction * size.z;

        lineSegmentList.push(new Vector3(xLeft, y, bbox.min.z), new Vector3(xLeft, y, bbox.max.z));
        lineSegmentList.push(
            new Vector3(xRight, y, bbox.min.z),
            new Vector3(xRight, y, bbox.max.z),
        );
        lineSegmentList.push(new Vector3(xLeft, bbox.min.y, z), new Vector3(xLeft, bbox.max.y, z));
        lineSegmentList.push(
            new Vector3(xRight, bbox.min.y, z),
            new Vector3(xRight, bbox.max.y, z),
        );
    }
    for (let i = 0; i < lineSegmentList.length; i++) {
        lineSegmentList[i].applyMatrix4(matrixWorld);
    }

    return new BufferGeometry().setFromPoints(lineSegmentList);
}

export const BoundingBoxHelperComponent = defineComponent({
    name: "BoundingBoxHelperComponent",

    onInit: _entity => {
        return {
            name: "bounding-box-helper",
            bbox: new Box3(),
            density: 2,
            color: 0xff0000,
            layerMask: ObjectLayerMasks.NodeHelper,
            entity,
        };
    },

    onSet: (entity, component, json) => {
        if (!json || !json.bbox || !json.bbox.isBox3)
            throw new Error("BoundingBoxHelperComponent: Requires Box3");
        component.bbox.set(json.bbox);

        if (typeof json.density === "number") component.density.set(json.density);
        if (matchesColor.test(json.color)) component.color.set(json.color);
        if (typeof json.layerMask === "number") component.layerMask.set(json.layerMask);
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, BoundingBoxHelperComponent);
        const helper = useHelperEntity(entity, component);
        const lineSegment = useOptionalComponent(helper, LineSegmentComponent);

        useEffect(() => {
            const bbox = component.bbox.value;
            const density = component.density.value;
            setComponent(helper, LineSegmentComponent, {
                name: "bbox-line-segment-" + entity,
                geometry: createBBoxGridGeometry(new Matrix4().identity(), bbox, density),
                material: new LineBasicMaterial({ color: component.color.value }),
                layerMask: component.layerMask.value,
            });
        }, []);

        useDidMount(() => {
            if (!lineSegment) return;
            const bbox = component.bbox.value;
            const density = component.density.value;
            lineSegment.geometry.set(
                createBBoxGridGeometry(new Matrix4().identity(), bbox, density),
            );
        }, [component.bbox]);

        useEffect(() => {
            if (!lineSegment) return;
            lineSegment.color.set(component.color.value);
        }, [component.color, lineSegment]);

        useEffect(() => {
            if (!lineSegment) return;
            lineSegment.layerMask.set(component.layerMask.value);
        }, [component.layerMask, lineSegment]);

        return null;
    },
});

const defaultMax = new Vector3(0.5, 0.5, 0.5);
const originalPosition = new Vector3();
const originalRotation = new Quaternion();
const originalScale = new Vector3();

export const ObjectGridSnapComponent = defineComponent({
    name: "ObjectGridSnapComponent",

    onInit: _entity => {
        return {
            bbox: new Box3(),
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        //if (typeof json.density === 'number') component.density.set(json.density)
        if (typeof json.bbox === "object" && json.bbox.isBox3) component.bbox.set(json.bbox);
    },

    reactor: () => {
        const entity = useEntityContext();
        const engineState = useState(getMutableState(EngineState));
        const snapComponent = useComponent(entity, ObjectGridSnapComponent);
        const modelComponent = useComponent(entity, ModelComponent);
        const meshComponents = useChildrenWithComponent(entity, MeshComponent);

        useEffect(() => {
            if (!modelComponent.scene.value) return;
            const originalParent = getComponent(entity, EntityTreeComponent).parentEntity;
            const transform = getComponent(entity, TransformComponent);
            transform.matrix.decompose(originalPosition, originalRotation, originalScale);
            //set entity transform to identity before calculating bounding box
            setComponent(entity, EntityTreeComponent, { parentEntity: UndefinedEntity });
            transform.matrixWorld.identity();
            TransformComponent.updateFromWorldMatrix(entity);

            const meshes = [];
            //iterate through children and update their transforms to reflect identity from parent
            iterateEntityNode(entity, childEntity => {
                if (hasComponent(childEntity, TransformComponent)) {
                    computeTransformMatrix(childEntity);
                    if (hasComponent(childEntity, MeshComponent)) {
                        meshes.push(getComponent(childEntity, MeshComponent));
                    }
                }
            });

            //compute bounding box
            const bbox = snapComponent.bbox.value.makeEmpty();
            if (meshes.length > 0) {
                for (let i = 0; i < meshes.length; i++) {
                    bbox.expandByObject(meshes[i]);
                }
            } else {
                bbox.set(Vector3_Zero, defaultMax);
            }

            //set entity transform back to original
            setComponent(entity, EntityTreeComponent, { parentEntity: originalParent });
            setComponent(entity, TransformComponent, {
                position: originalPosition,
                rotation: originalRotation,
                scale: originalScale,
            });

            iterateEntityNode(entity, computeTransformMatrix, childEntity =>
                hasComponent(childEntity, TransformComponent),
            );

            //set bounding box in component
            snapComponent.bbox.set(bbox);
        }, [modelComponent.scene, meshComponents]);

        useEffect(() => {
            if (!engineState.isEditing.value) return;
            const bbox = snapComponent.bbox.value;
            setComponent(entity, BoundingBoxHelperComponent, { bbox });

            return () => {
                removeComponent(entity, BoundingBoxHelperComponent);
            };
        }, [snapComponent.bbox, engineState.isEditing]);

        return null;
    },
});
