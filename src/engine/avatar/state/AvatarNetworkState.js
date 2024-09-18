import React, { useEffect, useLayoutEffect } from "react";

import { getOptionalComponent, setComponent, UUIDComponent } from "../../../ecs";
import { entityExists } from "../../../ecs/EntityFunctions";
import {
    defineState,
    getMutableState,
    none,
    useHookstate,
    useMutableState,
} from "../../../hyperflux";
import { WorldNetworkAction } from "../../../network";
import { NameComponent } from "../../../spatial/common/NameComponent";

import { AvatarColliderComponent } from "../components/AvatarControllerComponent";
import { loadAvatarModelAsset, unloadAvatarForUser } from "../functions/avatarFunctions";
import { spawnAvatarReceptor } from "../functions/spawnAvatarReceptor";
import { AvatarNetworkAction } from "./AvatarNetworkActions";

export const AvatarState = defineState({
    name: "ee.engine.avatar.AvatarState",

    initial: {},

    receptors: {
        onSpawn: AvatarNetworkAction.spawn.receive(action => {
            getMutableState(AvatarState)[action.entityUUID].set({
                avatarID: action.avatarID,
                name: action.name,
            });
        }),
        onSetAvatarID: AvatarNetworkAction.setAvatarID.receive(action => {
            getMutableState(AvatarState)[action.entityUUID].merge({ avatarID: action.avatarID });
        }),
        onSetAvatarName: AvatarNetworkAction.setName.receive(action => {
            getMutableState(AvatarState)[action.entityUUID].merge({ name: action.name });
        }),
        onDestroyObject: WorldNetworkAction.destroyEntity.receive(action => {
            getMutableState(AvatarState)[action.entityUUID].set(none);
        }),
    },

    selectRandomAvatar() {
        // API.instance
        //     .service(avatarPath)
        //     .find({})
        //     .then(avatars => {
        //         const randomAvatar = avatars.data[Math.floor(Math.random() * avatars.data.length)];
        //         AvatarState.updateUserAvatarId(randomAvatar.id);
        //     });
    },

    updateUserAvatarId(avatarId) {
        // API.instance
        //     .service(userAvatarPath)
        //     .patch(null, { avatarId: avatarId }, { query: { userId: Engine.instance.userID } })
        //     .then(() => {
        //         dispatchAction(
        //             AvatarNetworkAction.setAvatarID({
        //                 avatarID: avatarId,
        //                 entityUUID: Engine.instance.userID + "_avatar",
        //             }),
        //         );
        //     });
    },

    reactor: () => {
        const avatarState = useMutableState(AvatarState);
        return (
            <>
                {avatarState.keys.map(entityUUID => (
                    <AvatarReactor key={entityUUID} entityUUID={entityUUID} />
                ))}
            </>
        );
    },
});

const AvatarReactor = ({ entityUUID }) => {
    const { avatarID, name } = useHookstate(getMutableState(AvatarState)[entityUUID]);
    const userAvatarDetails = useHookstate(null);
    const entity = UUIDComponent.useEntityByUUID(entityUUID);

    useLayoutEffect(() => {
        if (!entity) return;
        spawnAvatarReceptor(entityUUID);
    }, [entity]);

    useEffect(() => {
        let aborted = false;

        // API.instance
        //     .service(avatarPath)
        //     .get(avatarID.value)
        //     .then(avatarDetails => {
        //         if (aborted) return;

        //         if (!avatarDetails.modelResource?.url) return;

        //         userAvatarDetails.set(avatarDetails.modelResource.url);
        //     });

        return () => {
            aborted = true;
        };
    }, [avatarID]);

    useEffect(() => {
        if (!entity || !userAvatarDetails.value) return;

        loadAvatarModelAsset(entity, userAvatarDetails.value);

        return () => {
            if (!entityExists(entity)) return;
            unloadAvatarForUser(entity);
        };
    }, [userAvatarDetails, entity]);

    useEffect(() => {
        if (!entity) return;
        setComponent(entity, NameComponent, name.value + "'s avatar");
        const colliderEntity = getOptionalComponent(
            entity,
            AvatarColliderComponent,
        )?.colliderEntity;
        if (colliderEntity) {
            setComponent(colliderEntity, NameComponent, name.value + "'s collider");
        }
    }, [name, entity]);

    return null;
};
