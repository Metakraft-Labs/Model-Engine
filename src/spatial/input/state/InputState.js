import { Raycaster, Vector2 } from "three";

import { UndefinedEntity } from "../../../ecs";
import { defineState, getMutableState, syncStateWithLocalStorage } from "../../../hyperflux";

export const InputState = defineState({
    name: "InputState",
    initial: () => ({
        preferredHand: "right",
        /** A screenspace raycaster for the pointer */
        pointerScreenRaycaster: new Raycaster(),
        scroll: new Vector2(),
        capturingEntity: UndefinedEntity,
        inputMeshes: new Set([]),
        inputBoundingBoxes: new Set([]),
    }),
    extension: syncStateWithLocalStorage(["preferredHand"]),
    setCapturingEntity: (entity, force = false) => {
        const inputState = getMutableState(InputState);
        if (force || inputState.capturingEntity.value === UndefinedEntity) {
            inputState.capturingEntity.set(entity);
        }
    },
});
