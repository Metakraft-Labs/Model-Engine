import { defineAction } from "../../hyperflux";
import { WorldNetworkAction } from "../../network";

import { matchesQuaternion, matchesVector3 } from "../common/functions/MatchesUtils";

export const SpawnObjectActions = {
    spawnObject: defineAction(
        WorldNetworkAction.spawnEntity.extend({
            type: "ee.engine.world.SPAWN_OBJECT",
            position: matchesVector3.optional(),
            rotation: matchesQuaternion.optional(),
        }),
    ),
};
