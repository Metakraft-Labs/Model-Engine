import { Types } from "bitecs";

import { defineComponent } from "../../../ecs/ComponentFunctions";

export const DistanceComponentSchema = { squaredDistance: Types.f32 };

export const DistanceFromLocalClientComponent = defineComponent({
    name: "DistanceFromLocalClientComponent",
    schema: DistanceComponentSchema,
});
export const DistanceFromCameraComponent = defineComponent({
    name: "DistanceFromCameraComponent",
    schema: DistanceComponentSchema,
});

export const FrustumCullCameraSchema = { isCulled: Types.ui8 };
export const FrustumCullCameraComponent = defineComponent({
    name: "FrustumCullCameraComponent",
    schema: FrustumCullCameraSchema,

    onRemove(entity) {
        // reset upon removing the component
        FrustumCullCameraComponent.isCulled[entity] = 0;
    },
});

export const compareDistanceToCamera = (a, b) => {
    const aDist = DistanceFromCameraComponent.squaredDistance[a];
    const bDist = DistanceFromCameraComponent.squaredDistance[b];
    return aDist - bDist;
};

export const compareDistanceToLocalClient = (a, b) => {
    const aDist = DistanceFromLocalClientComponent.squaredDistance[a];
    const bDist = DistanceFromLocalClientComponent.squaredDistance[b];
    return aDist - bDist;
};
