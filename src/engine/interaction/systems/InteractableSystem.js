import { Not } from "bitecs";

import { hasComponent, removeComponent, UUIDComponent } from "../../../ecs";
import { getComponent, getOptionalComponent } from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { getState } from "../../../hyperflux";
import { CallbackComponent } from "../../../spatial/common/CallbackComponent";
import { InputComponent } from "../../../spatial/input/components/InputComponent";
import { HighlightComponent } from "../../../spatial/renderer/components/HighlightComponent";
import { DistanceFromCameraComponent } from "../../../spatial/transform/components/DistanceComponents";
import { TransformSystem } from "../../../spatial/transform/systems/TransformSystem";

import { AvatarComponent } from "../../avatar/components/AvatarComponent";
import { InteractableComponent } from "../components/InteractableComponent";
import {
    gatherAvailableInteractables,
    InteractableState,
    InteractableTransitions,
} from "../functions/interactableFunctions";

//TODO get rid of the query.exit and put it in component as unmount useEffect return
//TODO get rid of this map eventually and store on the component instead

const interactableQuery = defineQuery([
    InteractableComponent,
    Not(AvatarComponent),
    DistanceFromCameraComponent,
]);
const hoverInputInteractablesQuery = defineQuery([InteractableComponent, InputComponent]);

let gatherAvailableInteractablesTimer = 0;

const execute = () => {
    gatherAvailableInteractablesTimer += getState(ECSState).deltaSeconds;
    // update every 0.1 seconds
    if (gatherAvailableInteractablesTimer > 0.1) gatherAvailableInteractablesTimer = 0;

    for (const entity of interactableQuery.exit()) {
        if (InteractableTransitions.has(entity)) InteractableTransitions.delete(entity);
        if (hasComponent(entity, HighlightComponent)) removeComponent(entity, HighlightComponent);
    }

    const interactables = interactableQuery();

    if (gatherAvailableInteractablesTimer === 0) {
        gatherAvailableInteractables(interactables);
    }
};

export const InteractableSystem = defineSystem({
    uuid: "ee.engine.InteractableSystem",
    insert: { before: TransformSystem },
    execute,
});

// const executeInput = () => {
//   if (getState(EngineState).isEditing) return

//   const inputPointerEntity = InputPointerComponent.getPointerForCanvas(Engine.instance.viewerEntity)
//   if (!inputPointerEntity) return

//   const buttons = InputSourceComponent.getMergedButtons()

//   const nonCapturedInputSource = InputSourceComponent.nonCapturedInputSources()
//   for (const entity of nonCapturedInputSource) {
//     const inputSource = getComponent(entity, InputSourceComponent)
//     if (buttons.KeyE?.down || inputSource.buttons[XRStandardGamepadButton.Trigger]?.down) {
//       interactWithClosestInteractable()
//     }
//   }

//   for (const entity of hoverInputInteractablesQuery()) {
//     const capturingEntity = getState(InputState).capturingEntity
//     const inputComponent = getComponent(entity, InputComponent)
//     const inputSourceEntity = inputComponent?.inputSources[0]

//     if (inputSourceEntity) {
//       const inputSource = getOptionalComponent(inputSourceEntity, InputSourceComponent)
//       if (capturingEntity !== UndefinedEntity) {
//         // return

//         const clickButtons = inputSource?.buttons
//         clicking = !!clickButtons //clicking on our boundingbox this frame

//         //TODO firing play on video each click, but for some reason only plays first time
//         //TODO refactor this, changing the execute timing is the only thing that makes this logic work, otherwise timings are different
//         //between PrimaryClick.up and capturingEntity being undefined or not
//         if (clicking && clickButtons) {
//           if (
//             clickButtons.PrimaryClick?.touched /*&& clickButtons.PrimaryClick.up*/ ||
//             clickButtons[XRStandardGamepadButton.Trigger]?.down
//           ) {
//             clickInteract(entity)
//           }
//         }
//       }
//     }

//     if (clicking && !inputSourceEntity && capturingEntity === UndefinedEntity) {
//       clicking = false
//     }
//   }
// }
//TODO only activate the one interactable closest to the camera center and within range or hovered
//TODO look into the design language (opacity, font size, etc) to differentiate between UI on and targeted for activation

let clicking = false;

const clickInteract = entity => {
    const interactable = getComponent(entity, InteractableComponent);
    for (const callback of interactable.callbacks) {
        if (callback.target && !UUIDComponent.getEntityByUUID(callback.target)) continue;
        const targetEntity = callback.target
            ? UUIDComponent.getEntityByUUID(callback.target)
            : entity;
        if (targetEntity && callback.callbackID) {
            const callbacks = getOptionalComponent(targetEntity, CallbackComponent);
            if (!callbacks) continue;
            callbacks.get(callback.callbackID)?.(entity, targetEntity);
        }
    }
};

const interactWithClosestInteractable = () => {
    const interactableEntity = getState(InteractableState).available[0];
    if (interactableEntity) {
        const interactable = getOptionalComponent(interactableEntity, InteractableComponent);
        if (interactable) {
            for (const callback of interactable.callbacks) {
                if (callback.target && !UUIDComponent.getEntityByUUID(callback.target)) continue;
                const targetEntity = callback.target
                    ? UUIDComponent.getEntityByUUID(callback.target)
                    : interactableEntity;
                if (targetEntity && callback.callbackID) {
                    const callbacks = getOptionalComponent(targetEntity, CallbackComponent);
                    if (!callbacks) continue;
                    callbacks.get(callback.callbackID)?.(interactableEntity, targetEntity);
                }
            }
        }
    }
};

// export const InteractableInputSystem = defineSystem({
//   uuid: 'ee.engine.InteractableInputSystem',
//   insert: { after: InputSystemGroup },
//   execute: executeInput
// })
