import { Frustum, Matrix4, Vector3 } from "three";

import { getComponent } from "../../../ecs";
import { defineState, getMutableState, getState } from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import {
    DistanceFromLocalClientComponent,
    compareDistanceToLocalClient,
} from "../../../spatial/transform/components/DistanceComponents";

import { EngineState } from "../../../spatial/EngineState";
import { InteractableComponent } from "../components/InteractableComponent";

const worldPosVec3 = new Vector3();
const mat4 = new Matrix4();
const frustum = new Frustum();

/**
 * Checks if entity is in range based on its own threshold
 * @param entity
 * @constructor
 */
const inRangeAndFrustumToInteract = entity => {
    const interactable = getComponent(entity, InteractableComponent);
    const maxDistanceSquare = interactable.activationDistance * interactable.activationDistance;
    let inRangeAndFrustum =
        DistanceFromLocalClientComponent.squaredDistance[entity] < maxDistanceSquare;
    if (inRangeAndFrustum) {
        inRangeAndFrustum = inFrustum(entity);
    }
    return inRangeAndFrustum;
};

export const InteractableState = defineState({
    name: "InteractableState",
    initial: () => {
        return {
            /**
             * all interactables within threshold range, in view of the camera, sorted by distance
             */
            available: [],
        };
    },
});

export const inFrustum = entity => {
    TransformComponent.getWorldPosition(entity, worldPosVec3);
    return frustum.containsPoint(worldPosVec3);
};

/**
 * Checks if entity can interact with any of entities listed in 'interactable' array, checking distance, guards and raycast
 * sorts the interactables by closest to the player
 */
export const gatherAvailableInteractables = interactables => {
    const availableInteractable = getMutableState(InteractableState).available;

    const viewerEntity = getState(EngineState).viewerEntity;
    if (!viewerEntity) return;

    const camera = getComponent(viewerEntity, CameraComponent);

    mat4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(mat4);

    availableInteractable.set(
        [...interactables]
            .filter(entity => inRangeAndFrustumToInteract(entity))
            .sort(compareDistanceToLocalClient),
    );
};

export const InteractableTransitions = new Map();
