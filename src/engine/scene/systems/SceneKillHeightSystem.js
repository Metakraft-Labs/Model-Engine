import { Not } from "bitecs";
import { Vector3 } from "three";

import { defineQuery, defineSystem, getComponent, setComponent, UUIDComponent } from "../../../ecs";
import { getState } from "../../../hyperflux";
import { NetworkObjectAuthorityTag } from "../../../network";
import { SpawnPoseState, TransformComponent } from "../../../spatial";
import {
    RigidBodyComponent,
    RigidBodyFixedTagComponent,
} from "../../../spatial/physics/components/RigidBodyComponent";
import { XRState } from "../../../spatial/xr/XRState";

import { SceneComponent } from "../../../spatial/renderer/components/SceneComponents";
import { getAncestorWithComponent } from "../../../spatial/transform/components/EntityTree";
import { TransformDirtyUpdateSystem } from "../../../spatial/transform/systems/TransformSystem";
import { updateReferenceSpaceFromAvatarMovement } from "../../avatar/functions/moveAvatar";
import { SceneSettingsComponent } from "../components/SceneSettingsComponent";

const heightKillApplicableQuery = defineQuery([
    RigidBodyComponent,
    NetworkObjectAuthorityTag,
    Not(RigidBodyFixedTagComponent),
]);

const settingsQuery = defineQuery([SceneSettingsComponent]);
const tempVector = new Vector3();

const execute = () => {
    const settingsEntities = settingsQuery();
    const sceneKillHeights = settingsEntities.map(entity => {
        return [
            getAncestorWithComponent(entity, SceneComponent),
            getComponent(entity, SceneSettingsComponent).sceneKillHeight,
        ];
    });
    const killableEntities = heightKillApplicableQuery();
    const isCameraAttachedToAvatar = XRState.isCameraAttachedToAvatar;

    for (const entity of killableEntities) {
        const sceneEntity = getAncestorWithComponent(entity, SceneComponent);
        const sceneHeight = sceneKillHeights.find(([scene]) => scene === sceneEntity)?.[1];
        if (typeof sceneHeight !== "number") continue;

        const rigidBodyPosition = getComponent(entity, RigidBodyComponent).position;
        if (rigidBodyPosition.y < sceneHeight) {
            const uuid = getComponent(entity, UUIDComponent);
            const spawnState = getState(SpawnPoseState)[uuid];

            // reset entity to it's spawn position
            setComponent(entity, TransformComponent, {
                position: spawnState?.spawnPosition,
                rotation: spawnState?.spawnRotation,
            });
            TransformComponent.dirtyTransforms[entity] = true;

            if (!isCameraAttachedToAvatar) continue;

            //@TODO see if we can implicitly update the reference space when the avatar teleports
            updateReferenceSpaceFromAvatarMovement(
                entity,
                tempVector.subVectors(spawnState?.spawnPosition, rigidBodyPosition),
            );
        }
    }
};

export const SceneKillHeightSystem = defineSystem({
    uuid: "ee.engine.SceneKillHeightSystem",
    insert: { before: TransformDirtyUpdateSystem },
    execute,
});
