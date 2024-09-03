import { Engine } from "../../../ecs/Engine";
import { dispatchAction } from "../../../hyperflux";
import { CameraActions } from "../../../spatial/camera/CameraState";

import { ikTargets } from "../../avatar/animation/Util";
import { AvatarNetworkAction } from "../../avatar/state/AvatarNetworkActions";

export const spawnLocalAvatarInWorld = props => {
    const { avatarSpawnPose, avatarID, parentUUID } = props;
    console.log("SPAWN IN WORLD", avatarSpawnPose, avatarID);
    const entityUUID = Engine.instance.userID;
    dispatchAction(
        AvatarNetworkAction.spawn({
            ...avatarSpawnPose,
            parentUUID,
            avatarID,
            entityUUID: entityUUID + "_avatar",
            name: props.name,
        }),
    );
    dispatchAction(CameraActions.spawnCamera({ parentUUID, entityUUID: entityUUID + "_camera" }));

    const headUUID = entityUUID + ikTargets.head;
    const leftHandUUID = entityUUID + ikTargets.leftHand;
    const rightHandUUID = entityUUID + ikTargets.rightHand;
    const leftFootUUID = entityUUID + ikTargets.leftFoot;
    const rightFootUUID = entityUUID + ikTargets.rightFoot;

    dispatchAction(
        AvatarNetworkAction.spawnIKTarget({
            parentUUID,
            entityUUID: headUUID,
            name: "head",
            blendWeight: 0,
        }),
    );
    dispatchAction(
        AvatarNetworkAction.spawnIKTarget({
            parentUUID,
            entityUUID: leftHandUUID,
            name: "leftHand",
            blendWeight: 0,
        }),
    );
    dispatchAction(
        AvatarNetworkAction.spawnIKTarget({
            parentUUID,
            entityUUID: rightHandUUID,
            name: "rightHand",
            blendWeight: 0,
        }),
    );
    dispatchAction(
        AvatarNetworkAction.spawnIKTarget({
            parentUUID,
            entityUUID: leftFootUUID,
            name: "leftFoot",
            blendWeight: 0,
        }),
    );
    dispatchAction(
        AvatarNetworkAction.spawnIKTarget({
            parentUUID,
            entityUUID: rightFootUUID,
            name: "rightFoot",
            blendWeight: 0,
        }),
    );
};
