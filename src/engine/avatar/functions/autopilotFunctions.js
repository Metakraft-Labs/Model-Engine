import { CylinderGeometry, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";

import { getComponent } from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { Engine } from "../../../ecs/Engine";
import { createEntity } from "../../../ecs/EntityFunctions";
import { defineState, getMutableState, getState } from "../../../hyperflux";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { Vector3_Up } from "../../../spatial/common/constants/MathConstants";
import { InputPointerComponent } from "../../../spatial/input/components/InputPointerComponent";
import { Physics } from "../../../spatial/physics/classes/Physics";
import { CollisionGroups } from "../../../spatial/physics/enums/CollisionGroups";
import { getInteractionGroups } from "../../../spatial/physics/functions/getInteractionGroups";
import { SceneQueryType } from "../../../spatial/physics/types/PhysicsTypes";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { setVisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { AvatarControllerComponent } from "../components/AvatarControllerComponent";

export const interactionGroups = getInteractionGroups(
    CollisionGroups.Avatars,
    CollisionGroups.Ground | CollisionGroups.Default,
);

const autopilotRaycastArgs = {
    type: SceneQueryType.Closest,
    origin: new Vector3(),
    direction: new Vector3(),
    maxDistance: 250,
    groups: interactionGroups,
};

export const autopilotSetPosition = entity => {
    const avatarControllerComponent = getComponent(entity, AvatarControllerComponent);
    const markerState = getMutableState(AutopilotMarker);
    if (avatarControllerComponent.gamepadLocalInput.lengthSq() > 0) return;

    const physicsWorld = Physics.getWorld(entity);
    if (!physicsWorld) return;

    const inputPointerEntity = InputPointerComponent.getPointersForCamera(
        Engine.instance.viewerEntity,
    )[0];
    if (!inputPointerEntity) return;
    const pointerPosition = getComponent(inputPointerEntity, InputPointerComponent).position;

    const castedRay = Physics.castRayFromCamera(
        physicsWorld,
        getComponent(Engine.instance.cameraEntity, CameraComponent),
        pointerPosition,
        autopilotRaycastArgs,
    );

    if (!castedRay.length) return;

    const rayNormal = new Vector3(
        castedRay[0].normal.x,
        castedRay[0].normal.y,
        castedRay[0].normal.z,
    );

    if (!assessWalkability(entity, rayNormal, castedRay[0].position, physicsWorld)) return;

    const autopilotPosition = castedRay[0].position;
    markerState.walkTarget.set(autopilotPosition);

    placeMarker(rayNormal);
};

export const AutopilotMarker = defineState({
    name: "autopilotMarkerState",
    initial: () => ({
        markerEntity,
        walkTarget,
    }),
});

const setupMarker = () => {
    const markerState = getMutableState(AutopilotMarker);
    const markerGeometry = new CylinderGeometry(0.175, 0.175, 0.05, 24, 1);
    const material = new MeshBasicMaterial({ color: "#FFF" });
    const mesh = new Mesh(markerGeometry, material);
    const markerEntity = createEntity();
    addObjectToGroup(markerEntity, mesh);
    markerState.markerEntity.set(markerEntity);
};

export const scaleFluctuate = (sinOffset = 4, scaleMultiplier = 0.2, pulseSpeed = 10) => {
    const markerEntity = getState(AutopilotMarker).markerEntity;
    const elapsedSeconds = getState(ECSState).elapsedSeconds;
    const scalePulse = scaleMultiplier * (sinOffset + Math.sin(pulseSpeed * elapsedSeconds));
    const transformComponent = getComponent(markerEntity, TransformComponent);
    transformComponent.scale.set(scalePulse, 1, scalePulse);
};

export async function placeMarker(rayNormal) {
    const markerState = getState(AutopilotMarker);

    if (!markerState.walkTarget) return;

    if (!markerState.markerEntity) setupMarker();

    const marker = markerState.markerEntity;
    setVisibleComponent(marker, true);

    const newRotation = new Quaternion().setFromUnitVectors(Vector3_Up, rayNormal);

    const markerTransform = getComponent(marker, TransformComponent);
    markerTransform.position.copy(markerState.walkTarget);
    markerTransform.rotation.copy(newRotation);
}

const minDot = 0.45;
const toWalkPoint = new Vector3();
export const assessWalkability = (entity, rayNormal, targetPosition, world) => {
    const transform = getComponent(entity, TransformComponent);
    autopilotRaycastArgs.origin.copy(transform.position).setY(transform.position.y + 1.5);
    autopilotRaycastArgs.direction.copy(targetPosition).sub(autopilotRaycastArgs.origin);
    const castedRay = Physics.castRay(world, autopilotRaycastArgs);

    toWalkPoint.copy(castedRay[0].position).sub(targetPosition);

    const flatEnough = rayNormal.dot(Vector3_Up) > minDot && toWalkPoint.lengthSq() < 0.5;
    return flatEnough;
};

export const clearWalkPoint = () => {
    const markerState = getMutableState(AutopilotMarker);
    markerState.walkTarget.set(null);
    if (!markerState.markerEntity.value) return;
    setVisibleComponent(markerState.markerEntity.value, false);
};
