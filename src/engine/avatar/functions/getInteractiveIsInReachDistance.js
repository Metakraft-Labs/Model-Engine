import { getHandTarget } from "../components/AvatarIKComponents";

export const interactableReachDistance = 3;

export const getInteractiveIsInReachDistance = (entityUser, interactablePosition, side) => {
    const target = getHandTarget(entityUser, side);
    if (!target) return false;
    return target.position.distanceTo(interactablePosition) < interactableReachDistance;
};
