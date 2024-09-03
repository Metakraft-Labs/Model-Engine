import React, { useLayoutEffect } from "react";

import { UUIDComponent } from "../../../ecs";
import { setComponent } from "../../../ecs/ComponentFunctions";
import {
    defineState,
    getMutableState,
    none,
    useHookstate,
    useMutableState,
} from "../../../hyperflux";
import { WorldNetworkAction } from "../../../network";
import { NameComponent } from "../../../spatial/common/NameComponent";

import { AvatarIKTargetComponent } from "../components/AvatarIKComponents";
import { AvatarNetworkAction } from "../state/AvatarNetworkActions";

export const AvatarIKTargetState = defineState({
    name: "ee.engine.avatar.AvatarIKTargetState",

    initial: {},

    receptors: {
        onSpawn: AvatarNetworkAction.spawnIKTarget.receive(action => {
            getMutableState(AvatarIKTargetState)[action.entityUUID].merge({ name: action.name });
        }),
        onDestroyObject: WorldNetworkAction.destroyEntity.receive(action => {
            getMutableState(AvatarIKTargetState)[action.entityUUID].set(none);
        }),
    },

    reactor: () => {
        const avatarIKTargetState = useMutableState(AvatarIKTargetState);
        return (
            <>
                {avatarIKTargetState.keys.map(entityUUID => (
                    <AvatarReactor key={entityUUID} entityUUID={entityUUID} />
                ))}
            </>
        );
    },
});

const AvatarReactor = ({ entityUUID }) => {
    const state = useHookstate(getMutableState(AvatarIKTargetState)[entityUUID]);
    const entity = UUIDComponent.useEntityByUUID(entityUUID);

    useLayoutEffect(() => {
        if (!entity) return;
        setComponent(entity, NameComponent, state.name.value);
        setComponent(entity, AvatarIKTargetComponent);
    }, [entity]);

    return null;
};
