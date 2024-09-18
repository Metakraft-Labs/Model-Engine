import { useEffect } from "react";
import { Vector3 } from "three";

import {
    defineComponent,
    getComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { UndefinedEntity } from "../../../ecs/Entity";
import { entityExists, useEntityContext } from "../../../ecs/EntityFunctions";
import { getState, matches } from "../../../hyperflux";
import { FollowCameraComponent } from "../../../spatial/camera/components/FollowCameraComponent";
import { TargetCameraRotationComponent } from "../../../spatial/camera/components/TargetCameraRotationComponent";
import { XRState } from "../../../spatial/xr/XRState";

import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { EngineState } from "../../../spatial/EngineState";
import { Physics } from "../../../spatial/physics/classes/Physics";
import { setAvatarColliderTransform } from "../functions/spawnAvatarReceptor";
import { AvatarComponent } from "./AvatarComponent";

export const eyeOffset = 0.25;

export const AvatarControllerComponent = defineComponent({
    name: "AvatarControllerComponent",

    onInit(_entity) {
        return {
            /** The camera entity that should be updated by this controller */
            cameraEntity: getState(EngineState).viewerEntity || UndefinedEntity,
            movementCaptured: [],
            isJumping: false,
            isWalking: false,
            isInAir: false,
            /** velocity along the Y axis */
            verticalVelocity: 0,
            /** Is the gamepad-driven jump active */
            gamepadJumpActive: false,
            /** gamepad-driven input, in the local XZ plane */
            gamepadLocalInput: new Vector3(),
            /** gamepad-driven movement, in the world XZ plane */
            gamepadWorldMovement: new Vector3(),
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;

        if (matches.number.test(json.cameraEntity)) component.cameraEntity.set(json.cameraEntity);
        if (matches.array.test(json.movementCaptured))
            component.movementCaptured.set(json.movementCaptured);
        if (matches.boolean.test(json.isJumping)) component.isJumping.set(json.isJumping);
        if (matches.boolean.test(json.isWalking)) component.isWalking.set(json.isWalking);
        if (matches.boolean.test(json.isInAir)) component.isInAir.set(json.isInAir);
        if (matches.number.test(json.verticalVelocity))
            component.verticalVelocity.set(json.verticalVelocity);
        if (matches.boolean.test(json.gamepadJumpActive))
            component.gamepadJumpActive.set(json.gamepadJumpActive);
        if (matches.object.test(json.gamepadLocalInput))
            component.gamepadLocalInput.set(json.gamepadLocalInput);
        if (matches.object.test(json.gamepadWorldMovement))
            component.gamepadWorldMovement.set(json.gamepadWorldMovement);
    },

    captureMovement(capturedEntity, entity) {
        const component = getComponent(capturedEntity, AvatarControllerComponent);
        if (component.movementCaptured.indexOf(entity) !== -1) return;
        component.movementCaptured.push(entity);
    },

    releaseMovement(capturedEntity, entity) {
        const component = getComponent(capturedEntity, AvatarControllerComponent);
        const index = component.movementCaptured.indexOf(entity);
        if (index !== -1) component.movementCaptured.splice(index, 1);
    },

    reactor: () => {
        const entity = useEntityContext();
        const avatarComponent = useComponent(entity, AvatarComponent);
        const avatarControllerComponent = useComponent(entity, AvatarControllerComponent);
        const isCameraAttachedToAvatar = XRState.useCameraAttachedToAvatar();
        const camera = useComponent(Engine.instance.cameraEntity, CameraComponent);
        const world = Physics.useWorld(entity);

        useEffect(() => {
            if (!world) return;
            Physics.createCharacterController(world, entity, {});
            world.cameraAttachedRigidbodyEntity = entity;
            return () => {
                world.cameraAttachedRigidbodyEntity = UndefinedEntity;
                Physics.removeCharacterController(world, entity);
            };
        }, [world]);

        useEffect(() => {
            setAvatarColliderTransform(entity);

            const cameraEntity = avatarControllerComponent.cameraEntity.value;
            if (
                cameraEntity &&
                entityExists(cameraEntity) &&
                hasComponent(cameraEntity, FollowCameraComponent)
            ) {
                const cameraComponent = getComponent(cameraEntity, FollowCameraComponent);
                cameraComponent.firstPersonOffset.set(
                    0,
                    avatarComponent.eyeHeight.value,
                    eyeOffset,
                );
                cameraComponent.thirdPersonOffset.set(0, avatarComponent.eyeHeight.value, 0);
            }
        }, [avatarComponent.avatarHeight, camera.near]);

        useEffect(() => {
            if (isCameraAttachedToAvatar) {
                const controller = getComponent(entity, AvatarControllerComponent);
                removeComponent(controller.cameraEntity, FollowCameraComponent);
            } else {
                const controller = getComponent(entity, AvatarControllerComponent);
                const targetCameraRotation = getComponent(
                    controller.cameraEntity,
                    TargetCameraRotationComponent,
                );
                setComponent(controller.cameraEntity, FollowCameraComponent, {
                    targetEntity,
                    phi: targetCameraRotation.phi,
                    theta: targetCameraRotation.theta,
                    firstPersonOffset: new Vector3(0, avatarComponent.eyeHeight.value, eyeOffset),
                    thirdPersonOffset: new Vector3(0, avatarComponent.eyeHeight.value, 0),
                });
            }
        }, [isCameraAttachedToAvatar]);

        return null;
    },
});

export const AvatarColliderComponent = defineComponent({
    name: "AvatarColliderComponent",
    onInit(_entity) {
        return {
            colliderEntity: UndefinedEntity,
        };
    },
    onSet(_entity, component, json) {
        if (!json) return;
        if (matches.number.test(json.colliderEntity))
            component.colliderEntity.set(json.colliderEntity);
    },
});
