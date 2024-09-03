import { UUIDComponent } from "../../../ecs";
import { getComponent } from "../../../ecs/ComponentFunctions";
import { getState } from "../../../hyperflux";
import { SpawnPoseState } from "../../../spatial";

import { AvatarControllerComponent } from "../components/AvatarControllerComponent";
import { teleportAvatar } from "./moveAvatar";

export const respawnAvatar = entity => {
    if (!entity) return;
    const { spawnPosition } = getState(SpawnPoseState)[getComponent(entity, UUIDComponent)];
    const controller = getComponent(entity, AvatarControllerComponent);
    controller.verticalVelocity = 0;
    teleportAvatar(entity, spawnPosition);
};
