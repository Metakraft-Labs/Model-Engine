import { Vector3 } from "three";

import {
    defineQuery,
    defineSystem,
    Engine,
    getComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
    UUIDComponent,
} from "../../../ecs";
import { dispatchAction } from "../../../hyperflux";
import { NetworkObjectAuthorityTag, NetworkState, WorldNetworkAction } from "../../../network";
import { TransformComponent, TransformSystem } from "../../../spatial";
import { FollowCameraComponent } from "../../../spatial/camera/components/FollowCameraComponent";
import { DistanceFromLocalClientComponent } from "../../../spatial/transform/components/DistanceComponents";
import { getDistanceSquaredFromTarget } from "../../../spatial/transform/systems/TransformSystem";

import { AvatarComponent } from "../components/AvatarComponent";
import { AvatarControllerComponent } from "../components/AvatarControllerComponent";
import { AvatarHeadDecapComponent } from "../components/AvatarIKComponents";
import { AvatarInputSystem } from "./AvatarInputSystem";

const controllerQuery = defineQuery([AvatarControllerComponent, NetworkObjectAuthorityTag]);

const execute = () => {
    const controlledEntities = controllerQuery();

    /** @todo non-immersive camera should utilize isCameraAttachedToAvatar */
    for (const entity of controlledEntities) {
        const controller = getComponent(entity, AvatarControllerComponent);

        const followCamera = getOptionalComponent(controller.cameraEntity, FollowCameraComponent);
        if (followCamera) {
            // todo calculate head size and use that as the bound #7263
            if (followCamera.distance < 0.3) setComponent(entity, AvatarHeadDecapComponent, true);
            else removeComponent(entity, AvatarHeadDecapComponent);
        }

        if (!controller.movementCaptured.length) {
            if (
                !hasComponent(entity, NetworkObjectAuthorityTag) &&
                NetworkState.worldNetwork &&
                controller.gamepadLocalInput.lengthSq() > 0
            ) {
                dispatchAction(
                    WorldNetworkAction.transferAuthorityOfObject({
                        ownerID: Engine.instance.userID,
                        entityUUID: getComponent(entity, UUIDComponent),
                        newAuthority: Engine.instance.store.peerID,
                    }),
                );
                setComponent(entity, NetworkObjectAuthorityTag);
            }
        }
    }
};

export const AvatarControllerSystem = defineSystem({
    uuid: "ee.engine.AvatarControllerSystem",
    insert: { after: AvatarInputSystem },
    execute,
});

const distanceFromLocalClientQuery = defineQuery([
    TransformComponent,
    DistanceFromLocalClientComponent,
]);

export const AvatarPostTransformSystem = defineSystem({
    uuid: "ee.engine.AvatarPostTransformSystem",
    insert: { after: TransformSystem },
    execute: () => {
        const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();
        if (!selfAvatarEntity) return;
        const localClientPosition = TransformComponent.getWorldPosition(selfAvatarEntity, vec3);
        if (localClientPosition) {
            for (const entity of distanceFromLocalClientQuery())
                DistanceFromLocalClientComponent.squaredDistance[entity] =
                    getDistanceSquaredFromTarget(entity, localClientPosition);
        }
    },
});

const vec3 = new Vector3();
