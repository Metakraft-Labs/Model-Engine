import matches from "ts-matches";

import { matchesEntityUUID } from "../../../ecs";
import { defineAction, defineState, getMutableState, none } from "../../../hyperflux";
import { NetworkTopics } from "../../../network";

export class MountPointActions {
    static mountInteraction = defineAction({
        type: "ee.engine.interactions.MOUNT",
        mounted: matches.boolean,
        targetMount: matchesEntityUUID,
        mountedEntity: matchesEntityUUID,
        $topic: NetworkTopics.world,
    });
}

export const MountPointState = defineState({
    name: "MountPointState",
    initial: {},
    receptors: {
        onMountInteraction: MountPointActions.mountInteraction.receive(action => {
            const state = getMutableState(MountPointState);
            if (action.mounted) state[action.targetMount].merge(action.mountedEntity);
            else state[action.targetMount].set(none);
        }),
    },
});
