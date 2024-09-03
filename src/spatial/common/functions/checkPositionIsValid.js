import { Vector3 } from "three";
import { Physics } from "../../physics/classes/Physics";
import { AvatarCollisionMask, CollisionGroups } from "../../physics/enums/CollisionGroups";
import { getInteractionGroups } from "../../physics/functions/getInteractionGroups";
import { SceneQueryType } from "../../physics/types/PhysicsTypes";

const raycastComponentData = {
    type: SceneQueryType.Closest,
    origin: new Vector3(),
    direction: new Vector3(0, -1, 0),
    maxDistance: 2,
    groups: 0,
};

/**
 * Checks if given position is a valid position to move avatar too.
 * @param position
 * @param onlyAllowPositionOnGround, if set will only consider the given position as valid if it falls on the ground
 * @returns {
 * positionValid, the given position is a valid position
 * raycastHit, the raycastHit result of the physics raycast
 * }
 */
export default function checkPositionIsValid(
    physicsWorld,
    position,
    onlyAllowPositionOnGround = true,
    raycastDirection = new Vector3(0, -1, 0),
) {
    const collisionLayer = onlyAllowPositionOnGround ? CollisionGroups.Ground : AvatarCollisionMask;
    const interactionGroups = getInteractionGroups(CollisionGroups.Avatars, collisionLayer);

    raycastComponentData.direction.copy(raycastDirection);
    raycastComponentData.origin.copy(position);
    raycastComponentData.groups = interactionGroups;
    const hits = Physics.castRay(physicsWorld, raycastComponentData);

    let positionValid = false;
    let raycastHit = null;
    if (hits.length > 0) {
        raycastHit = hits[0];
        if (onlyAllowPositionOnGround) {
            positionValid = true;
        } else {
            if (raycastHit.normal.y > 0.9) positionValid = true;
        }
    }

    return {
        positionValid: positionValid,
        raycastHit: raycastHit,
    };
}
