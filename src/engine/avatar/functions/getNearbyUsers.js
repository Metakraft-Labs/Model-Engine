import { getComponent } from "../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { NetworkObjectComponent } from "../../../network";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { AvatarComponent } from "../../avatar/components/AvatarComponent";

const compareDistance = (a, b) => a.distance - b.distance;

const remoteAvatars = defineQuery([NetworkObjectComponent, AvatarComponent, TransformComponent]);

export function getNearbyUsers(userId, nonChannelUserIds) {
    const userAvatarEntity = AvatarComponent.getUserAvatarEntity(userId);
    if (!userAvatarEntity) return [];
    const userPosition = getComponent(userAvatarEntity, TransformComponent).position;
    if (!userPosition) return [];
    const userDistances = [];
    for (const avatarEntity of remoteAvatars()) {
        if (userAvatarEntity === avatarEntity) continue;
        const position = getComponent(avatarEntity, TransformComponent).position;
        const ownerId = getComponent(avatarEntity, NetworkObjectComponent).ownerId;
        userDistances.push({
            id: ownerId,
            distance: position.distanceTo(userPosition),
        });
    }
    return userDistances
        .filter(u => nonChannelUserIds.indexOf(u.id) > -1)
        .sort(compareDistance)
        .map(u => u.id);
}
