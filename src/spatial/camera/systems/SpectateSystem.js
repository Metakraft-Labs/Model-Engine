import React, { useEffect } from "react";
import { MathUtils } from "three";

import {
    Engine,
    getComponent,
    getOptionalComponent,
    matchesEntityUUID,
    removeComponent,
    setComponent,
    UUIDComponent,
} from "../../../ecs";
import {
    defineAction,
    defineState,
    getMutableState,
    getState,
    none,
    useHookstate,
    useMutableState,
} from "../../../hyperflux";
import { matchesUserID, NetworkTopics, WorldNetworkAction } from "../../../network";

import { EngineState } from "../../EngineState";
import { ComputedTransformComponent } from "../../transform/components/ComputedTransformComponent";
import { TransformComponent } from "../../transform/components/TransformComponent";
import { FlyControlComponent } from "../components/FlyControlComponent";

export class SpectateActions {
    static spectateEntity = defineAction({
        type: "ee.engine.Engine.SPECTATE_USER",
        spectatorUserID: matchesUserID,
        spectatingEntity: matchesEntityUUID.optional(),
        $topic: NetworkTopics.world,
    });

    static exitSpectate = defineAction({
        type: "ee.engine.Engine.EXIT_SPECTATE",
        spectatorUserID: matchesUserID,
        $topic: NetworkTopics.world,
    });
}

export const SpectateEntityState = defineState({
    name: "SpectateEntityState",
    initial: {},

    receptors: {
        onSpectateUser: SpectateActions.spectateEntity.receive(action => {
            getMutableState(SpectateEntityState)[action.spectatorUserID].set({
                spectating: action.spectatingEntity,
            });
        }),
        onEntityDestroy: WorldNetworkAction.destroyEntity.receive(action => {
            if (getState(SpectateEntityState)[action.entityUUID]) {
                getMutableState(SpectateEntityState)[action.entityUUID].set(none);
            }
            for (const spectatorUserID in getState(SpectateEntityState)) {
                if (
                    getState(SpectateEntityState)[spectatorUserID].spectating === action.entityUUID
                ) {
                    getMutableState(SpectateEntityState)[spectatorUserID].set(none);
                }
            }
        }),
        onExitSpectate: SpectateActions.exitSpectate.receive(action => {
            getMutableState(SpectateEntityState)[action.spectatorUserID].set(none);
        }),
    },

    reactor: () => {
        const state = useMutableState(SpectateEntityState);

        if (!state.value[Engine.instance.userID]) return null;

        return <SpectatorReactor />;
    },
});

const SpectatorReactor = () => {
    const state = useHookstate(getMutableState(SpectateEntityState)[Engine.instance.userID]);

    useEffect(() => {
        const cameraEntity = getState(EngineState).viewerEntity;

        if (!state.spectating.value) {
            setComponent(cameraEntity, FlyControlComponent, {
                boostSpeed: 4,
                moveSpeed: 4,
                lookSensitivity: 5,
                maxXRotation: MathUtils.degToRad(80),
            });
            return () => {
                removeComponent(cameraEntity, FlyControlComponent);
            };
        }
    }, [state.spectating]);

    if (!state.spectating.value) return null;

    return (
        <SpectatingUserReactor key={state.spectating.value} entityUUID={state.spectating.value} />
    );
};

const SpectatingUserReactor = props => {
    const spectateEntity = UUIDComponent.useEntityByUUID(props.entityUUID);

    useEffect(() => {
        if (!spectateEntity) return;

        const cameraEntity = getState(EngineState).viewerEntity;
        const cameraTransform = getComponent(cameraEntity, TransformComponent);
        setComponent(cameraEntity, ComputedTransformComponent, {
            referenceEntities: [spectateEntity],
            computeFunction: () => {
                const networkTransform = getOptionalComponent(spectateEntity, TransformComponent);
                if (!networkTransform) return;
                cameraTransform.position.copy(networkTransform.position);
                cameraTransform.rotation.copy(networkTransform.rotation);
            },
        });
        return () => {
            removeComponent(cameraEntity, ComputedTransformComponent);
        };
    }, [spectateEntity]);

    return null;
};
