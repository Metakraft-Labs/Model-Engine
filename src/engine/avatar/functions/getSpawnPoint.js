import { Quaternion, Vector3 } from "three";

import { UUIDComponent } from "../../../ecs";
import { getComponent } from "../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { SpawnPointComponent } from "../../scene/components/SpawnPointComponent";

export function getSpawnPoint(spawnPointNodeId, userId) {
    const entity = UUIDComponent.getEntityByUUID(spawnPointNodeId);
    if (entity) {
        const spawnTransform = getComponent(entity, TransformComponent);
        const spawnComponent = getComponent(entity, SpawnPointComponent);
        if (
            !spawnComponent.permissionedUsers.length ||
            spawnComponent.permissionedUsers.includes(userId)
        ) {
            return {
                position: spawnTransform.position
                    .clone()
                    .add(
                        randomPositionCentered(
                            new Vector3(spawnTransform.scale.x, 0, spawnTransform.scale.z),
                        ),
                    ),
                rotation: spawnTransform.rotation.clone(),
            };
        }
    }
    return getRandomSpawnPoint(userId);
}

const randomPositionCentered = area => {
    return new Vector3(
        (Math.random() - 0.5) * area.x,
        (Math.random() - 0.5) * area.y,
        (Math.random() - 0.5) * area.z,
    );
};

const spawnPointQuery = defineQuery([SpawnPointComponent, TransformComponent]);

export function getRandomSpawnPoint(userId) {
    const spawnPoints = spawnPointQuery();
    const spawnPointForUser = spawnPoints.find(entity =>
        getComponent(entity, SpawnPointComponent).permissionedUsers.includes(userId),
    );
    const entity =
        spawnPointForUser ?? spawnPoints[Math.round(Math.random() * (spawnPoints.length - 1))];
    if (entity) {
        const spawnTransform = getComponent(entity, TransformComponent);
        return {
            position: spawnTransform.position
                .clone()
                .add(
                    randomPositionCentered(
                        new Vector3(spawnTransform.scale.x, 0, spawnTransform.scale.z),
                    ),
                ),
            rotation: spawnTransform.rotation.clone(),
        };
    }

    console.warn("Couldn't spawn entity at spawn point, no spawn points available");

    return {
        position: randomPositionCentered(new Vector3(2, 0, 2)),
        rotation: new Quaternion(),
    };
}
