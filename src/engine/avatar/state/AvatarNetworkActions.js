import matches from "ts-matches";

import { matchesEntityUUID } from "../../../ecs";
import { defineAction } from "../../../hyperflux";
import { NetworkTopics } from "../../../network";
import { SpawnObjectActions } from "../../../spatial/transform/SpawnObjectActions";

import { matchesIkTarget } from "../animation/Util";

export class AvatarNetworkAction {
    static spawn = defineAction(
        SpawnObjectActions.spawnObject.extend({
            type: "ee.engine.avatar.SPAWN",
            avatarID: matches.string,
            name: matches.string,
        }),
    );

    static setAnimationState = defineAction({
        type: "ee.engine.avatar.SET_ANIMATION_STATE",
        entityUUID: matchesEntityUUID,
        clipName: matches.string.optional(),
        animationAsset: matches.string,
        loop: matches.boolean.optional(),
        needsSkip: matches.boolean.optional(),
        layer: matches.number.optional(),
        $topic: NetworkTopics.world,
    });

    static setAvatarID = defineAction({
        type: "ee.engine.avatar.SET_AVATAR_ID",
        entityUUID: matchesEntityUUID,
        avatarID: matches.string,
        $cache: {
            removePrevious: true,
        },
        $topic: NetworkTopics.world,
    });

    static setName = defineAction({
        type: "ee.engine.avatar.SET_AVATAR_ID",
        entityUUID: matchesEntityUUID,
        name: matches.string,
        $cache: {
            removePrevious: true,
        },
        $topic: NetworkTopics.world,
    });

    static spawnIKTarget = defineAction(
        SpawnObjectActions.spawnObject.extend({
            type: "ee.engine.avatar.SPAWN_IK_TARGET",
            name: matchesIkTarget,
            blendWeight: matches.number,
        }),
    );
}
