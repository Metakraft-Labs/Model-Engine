import { useEffect } from "react";
import { Frustum, Matrix4, Vector3 } from "three";

import { insertionSort } from "../../../common/src/utils/insertionSort";
import {
    AnimationSystemGroup,
    defineQuery,
    defineSystem,
    getComponent,
    getOptionalComponent,
    hasComponent,
} from "../../../ecs";
import { getMutableState, getState, none } from "../../../hyperflux";
import { NetworkState } from "../../../network";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";

import { CameraComponent } from "../../camera/components/CameraComponent";
import { EngineState } from "../../EngineState";
import { RigidBodyComponent } from "../../physics/components/RigidBodyComponent";
import { GroupComponent } from "../../renderer/components/GroupComponent";
import { VisibleComponent } from "../../renderer/components/VisibleComponent";
import { XRState } from "../../xr/XRState";
import { BoundingBoxComponent, updateBoundingBox } from "../components/BoundingBoxComponents";
import { ComputedTransformComponent } from "../components/ComputedTransformComponent";
import {
    DistanceFromCameraComponent,
    FrustumCullCameraComponent,
} from "../components/DistanceComponents";
import { composeMatrix, TransformComponent } from "../components/TransformComponent";
import { TransformSerialization } from "../TransformSerialization";

const transformQuery = defineQuery([TransformComponent]);
const groupQuery = defineQuery([GroupComponent, VisibleComponent]);

const boundingBoxQuery = defineQuery([BoundingBoxComponent]);

const distanceFromCameraQuery = defineQuery([TransformComponent, DistanceFromCameraComponent]);
const frustumCulledQuery = defineQuery([TransformComponent, FrustumCullCameraComponent]);

const cameraQuery = defineQuery([TransformComponent, CameraComponent]);

export const computeTransformMatrix = entity => {
    const transform = getComponent(entity, TransformComponent);
    getOptionalComponent(entity, ComputedTransformComponent)?.computeFunction();
    composeMatrix(entity);
    const entityTree = getOptionalComponent(entity, EntityTreeComponent);
    const parentEntity = entityTree?.parentEntity;
    if (parentEntity) {
        const parentTransform = getOptionalComponent(parentEntity, TransformComponent);
        if (parentTransform)
            transform.matrixWorld.multiplyMatrices(parentTransform.matrixWorld, transform.matrix);
    } else {
        transform.matrixWorld.copy(transform.matrix);
    }
};

export const updateGroupChildren = entity => {
    const group = getComponent(entity, GroupComponent);
    // drop down one level and update children

    for (const root of group) {
        if (root.isProxified) continue;
        for (const obj of root.children) {
            obj.updateMatrixWorld();
            obj.matrixWorldNeedsUpdate = false;
        }
    }
};

const _tempDistSqrVec3 = new Vector3();

export const getDistanceSquaredFromTarget = (entity, targetPosition) => {
    return TransformComponent.getWorldPosition(entity, _tempDistSqrVec3).distanceToSquared(
        targetPosition,
    );
};

const _frustum = new Frustum();
const _worldPos = new Vector3();
const _projScreenMatrix = new Matrix4();

const transformDepths = new Map();

const updateTransformDepth = entity => {
    if (transformDepths.has(entity)) return transformDepths.get(entity);

    const referenceEntities = getOptionalComponent(
        entity,
        ComputedTransformComponent,
    )?.referenceEntities;
    const parentEntity = getOptionalComponent(entity, EntityTreeComponent)?.parentEntity;

    const referenceEntityDepths = referenceEntities
        ? referenceEntities.map(updateTransformDepth)
        : [];
    const parentEntityDepth = parentEntity ? updateTransformDepth(parentEntity) : 0;
    const depth = Math.max(...referenceEntityDepths, parentEntityDepth) + 1;
    transformDepths.set(entity, depth);

    return depth;
};

const compareReferenceDepth = (a, b) => {
    const aDepth = transformDepths.get(a);
    const bDepth = transformDepths.get(b);
    return aDepth - bDepth;
};

const isDirtyNonRigidbody = entity =>
    TransformComponent.dirtyTransforms[entity] && !hasComponent(entity, RigidBodyComponent);
export const isDirty = entity => TransformComponent.dirtyTransforms[entity];

const sortedTransformEntities = [];

const sortAndMakeDirtyEntities = () => {
    // TODO: move entity tree mutation logic here for more deterministic and less redundant calculations

    // if transform order is dirty, sort by reference depth
    // Note: cyclic references will cause undefined behavior

    /**
     * Sort transforms if needed
     */

    let needsSorting = TransformComponent.transformsNeedSorting;

    for (const entity of transformQuery.enter()) {
        sortedTransformEntities.push(entity);
        needsSorting = true;
    }

    for (const entity of transformQuery.exit()) {
        const idx = sortedTransformEntities.indexOf(entity);
        idx > -1 && sortedTransformEntities.splice(idx, 1);
        needsSorting = true;
    }

    if (needsSorting) {
        transformDepths.clear();
        for (const entity of sortedTransformEntities) updateTransformDepth(entity);
        insertionSort(sortedTransformEntities, compareReferenceDepth); // Insertion sort is speedy O(n) for mostly sorted arrays
        TransformComponent.transformsNeedSorting = false;
    }

    // entities with dirty parent or reference entities, or computed transforms, should also be dirty
    for (const entity of sortedTransformEntities) {
        TransformComponent.dirtyTransforms[entity] =
            TransformComponent.dirtyTransforms[entity] ||
            hasComponent(entity, ComputedTransformComponent) ||
            TransformComponent.dirtyTransforms[
                getOptionalComponent(entity, EntityTreeComponent)?.parentEntity ?? -1
            ] ||
            false;
    }
};

const execute = () => {
    const dirtySortedTransformEntities = sortedTransformEntities.filter(isDirtyNonRigidbody);
    for (const entity of dirtySortedTransformEntities) computeTransformMatrix(entity);

    const dirtyGroupEntities = groupQuery().filter(isDirty);
    for (const entity of dirtyGroupEntities) updateGroupChildren(entity);

    const dirtyBoundingBoxes = boundingBoxQuery().filter(isDirty);
    for (const entity of dirtyBoundingBoxes) updateBoundingBox(entity);

    const viewerEntity = getState(EngineState).viewerEntity;
    const cameraEntities = cameraQuery();

    const xrFrame = getState(XRState).xrFrame;

    for (const entity of cameraEntities) {
        if (xrFrame && entity === viewerEntity) continue;
        const camera = getComponent(entity, CameraComponent);
        camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
        const viewCamera = camera.cameras[0];
        viewCamera.matrixWorld.copy(camera.matrixWorld);
        viewCamera.matrixWorldInverse.copy(camera.matrixWorldInverse);
        viewCamera.projectionMatrix.copy(camera.projectionMatrix);
        viewCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    }

    if (!viewerEntity) return;

    const cameraPosition = getComponent(viewerEntity, TransformComponent).position;
    const camera = getComponent(viewerEntity, CameraComponent);
    for (const entity of distanceFromCameraQuery())
        DistanceFromCameraComponent.squaredDistance[entity] = getDistanceSquaredFromTarget(
            entity,
            cameraPosition,
        );

    /** @todo expose the frustum in WebGLRenderer to not calculate this twice  */
    _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projScreenMatrix);

    for (const entity of frustumCulledQuery()) {
        const boundingBox = (
            getOptionalComponent(entity, BoundingBoxComponent) ??
            getOptionalComponent(entity, BoundingBoxComponent)
        )?.box;
        const cull = boundingBox
            ? _frustum.intersectsBox(boundingBox)
            : _frustum.containsPoint(TransformComponent.getWorldPosition(entity, _worldPos));
        FrustumCullCameraComponent.isCulled[entity] = cull ? 0 : 1;
    }
};

const reactor = () => {
    useEffect(() => {
        const networkState = getMutableState(NetworkState);

        networkState.networkSchema[TransformSerialization.ID].set({
            read: TransformSerialization.readTransform,
            write: TransformSerialization.writeTransform,
        });

        return () => {
            networkState.networkSchema[TransformSerialization.ID].set(none);
            sortedTransformEntities.length = 0;
            transformDepths.clear();
        };
    }, []);
    return null;
};

export const TransformSystem = defineSystem({
    uuid: "ee.engine.TransformSystem",
    insert: { after: AnimationSystemGroup },
    execute,
    reactor,
});

export const TransformDirtyUpdateSystem = defineSystem({
    uuid: "ee.engine.TransformDirtyUpdateSystem",
    insert: { before: TransformSystem },
    execute: sortAndMakeDirtyEntities,
});

export const TransformDirtyCleanupSystem = defineSystem({
    uuid: "ee.engine.TransformDirtyCleanupSystem",
    insert: { after: TransformSystem },
    execute: () => {
        for (const entity in TransformComponent.dirtyTransforms)
            delete TransformComponent.dirtyTransforms[entity];
    },
});
