import { Quaternion, Vector3 } from "three";
import {
    getComponent,
    getMutableComponent,
    getOptionalComponent,
    hasComponent,
    UndefinedEntity,
    UUIDComponent,
} from "../../../ecs";
import { PI, Q_IDENTITY, Vector3_Zero } from "../../common/constants/MathConstants";
import { TransformComponent } from "../../SpatialModule";
import { getAncestorWithComponent } from "../../transform/components/EntityTree";
import { TransformGizmoTagComponent } from "../../transform/components/TransformComponent";
import { XRSpaceComponent } from "../../xr/XRComponents";
import { XRUIComponent } from "../../xrui/components/XRUIComponent";
import { InputComponent } from "../components/InputComponent";
import { InputPointerComponent } from "../components/InputPointerComponent";
import { InputSourceComponent } from "../components/InputSourceComponent";
import { createInitialButtonState, MouseButton } from "../state/ButtonState";

/** radian threshold for rotating state*/
const ROTATING_THRESHOLD = 1.5 * (PI / 180);

/** squared distance threshold for dragging state */
const DRAGGING_THRESHOLD = 0.001;

/** anti-garbage variable!! value not to be used unless you set values just before use*/
const _pointerPositionVector3 = new Vector3();

export function preventDefault(e) {
    e.preventDefault();
}

export const preventDefaultKeyDown = evt => {
    if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
    )
        return;
    if (evt.code === "Tab") evt.preventDefault();
    // prevent DOM tab selection and spacebar/enter button toggling (since it interferes with avatar controls)
    if (evt.code === "Space" || evt.code === "Enter") evt.preventDefault();
};

export function updateGamepadInput(eid) {
    const inputSource = getComponent(eid, InputSourceComponent);
    const gamepad = inputSource.source.gamepad;
    const buttons = inputSource?.buttons;
    // const buttonDownPos = inputSource.buttonDownPositions as WeakMap<AnyButton, Vector3>
    // log buttons
    // if (source.gamepad) {
    //   for (let i = 0; i < source.gamepad.buttons.length; i++) {
    //     const button = source.gamepad.buttons[i]
    //     if (button.pressed) console.log('button ' + i + ' pressed: ' + button.pressed)
    //   }
    // }

    if (!gamepad) return;
    const gamepadButtons = gamepad?.buttons;
    if (!gamepadButtons.length) return;

    const pointer = getOptionalComponent(eid, InputPointerComponent);
    const xrTransform = getOptionalComponent(eid, TransformComponent);

    for (let i = 0; i < gamepadButtons.length; i++) {
        const gamepadButton = gamepadButtons[i];
        if (!buttons[i] && (gamepadButton.pressed || gamepadButton.touched)) {
            buttons[i] = createInitialButtonState(eid, gamepadButton);
        }
        const buttonState = buttons[i];
        if (buttonState && (gamepadButton.pressed || gamepadButton.touched)) {
            if (!buttonState.pressed && gamepadButton.pressed) {
                buttonState.down = true;
                buttonState.downPosition = new Vector3();
                buttonState.downRotation = new Quaternion();

                if (pointer) {
                    buttonState.downPosition.set(pointer.position.x, pointer.position.y, 0);
                    //TODO maybe map pointer rotation/swing/twist to downRotation here once we map the pointer events to that (think Apple pencil)
                } else if (hasComponent(eid, XRSpaceComponent) && xrTransform) {
                    buttonState.downPosition.copy(xrTransform.position);
                    buttonState.downRotation.copy(xrTransform.rotation);
                }
            }
            buttonState.pressed = gamepadButton.pressed;
            buttonState.touched = gamepadButton.touched;
            buttonState.value = gamepadButton.value;

            if (buttonState.downPosition) {
                //if not yet dragging, compare distance to drag threshold and begin if appropriate
                if (!buttonState.dragging) {
                    if (pointer)
                        _pointerPositionVector3.set(pointer.position.x, pointer.position.y, 0);
                    const squaredDistance = buttonState.downPosition.distanceToSquared(
                        pointer ? _pointerPositionVector3 : (xrTransform?.position ?? Vector3_Zero),
                    );

                    if (squaredDistance > DRAGGING_THRESHOLD) {
                        buttonState.dragging = true;
                    }
                }

                //if not yet rotating, compare distance to drag threshold and begin if appropriate
                if (!buttonState.rotating) {
                    const angleRadians = buttonState.downRotation?.angleTo(
                        pointer ? Q_IDENTITY : (xrTransform?.rotation ?? Q_IDENTITY),
                    );
                    if (angleRadians > ROTATING_THRESHOLD) {
                        buttonState.rotating = true;
                    }
                }
            }
        } else if (buttonState) {
            buttonState.up = true;
        }
    }
}
export const setInputSources = (startEntity, inputSources) => {
    const inputEntity = getAncestorWithComponent(startEntity, InputComponent);
    if (!inputEntity) return;
    const inputComponent = getComponent(inputEntity, InputComponent);

    for (const sinkEntityUUID of inputComponent.inputSinks) {
        const sinkEntity =
            sinkEntityUUID === "Self" ? inputEntity : UUIDComponent.getEntityByUUID(sinkEntityUUID); //TODO why is this not sending input to my sinks
        const sinkInputComponent = getMutableComponent(sinkEntity, InputComponent);
        sinkInputComponent.inputSources.merge(inputSources);
    }
};

export function updatePointerDragging(pointerEntity, event) {
    const inputSourceComponent = getOptionalComponent(pointerEntity, InputSourceComponent);
    if (!inputSourceComponent) return;

    const state = inputSourceComponent?.buttons;

    let button = MouseButton.PrimaryClick;
    if (event.type === "pointermove") {
        if (event.button === 1) button = MouseButton.AuxiliaryClick;
        else if (event.button === 2) button = MouseButton.SecondaryClick;
    }
    const btn = state[button];
    if (btn && !btn.dragging) {
        const pointer = getOptionalComponent(pointerEntity, InputPointerComponent);

        if (btn.pressed && btn.downPosition) {
            //if not yet dragging, compare distance to drag threshold and begin if appropriate
            if (!btn.dragging) {
                pointer
                    ? _pointerPositionVector3.set(pointer.position.x, pointer.position.y, 0)
                    : _pointerPositionVector3.copy(Vector3_Zero);
                const squaredDistance = btn.downPosition.distanceToSquared(_pointerPositionVector3);

                if (squaredDistance > DRAGGING_THRESHOLD) {
                    btn.dragging = true;
                }
            }
        }
    }
}

export function cleanupButton(key, buttons, hasFocus) {
    const button = buttons[key];
    if (button?.down) button.down = false;
    if (button?.up || !hasFocus) delete buttons[key];
}

export const redirectPointerEventsToXRUI = (cameraEntity, evt) => {
    const pointerEntity = InputPointerComponent.getPointerByID(cameraEntity, evt.pointerId);
    const inputSource = getOptionalComponent(pointerEntity, InputSourceComponent);
    if (!inputSource) return;
    for (const i of inputSource.intersections) {
        const entity = i.entity;
        const xrui = getOptionalComponent(entity, XRUIComponent);
        if (!xrui) continue;
        xrui.updateWorldMatrix(true, true);
        const raycaster = inputSource.raycaster;
        const hit = xrui.hitTest(raycaster.ray);
        if (hit && hit.intersection.object.visible) {
            hit.target.dispatchEvent(new evt.constructor(evt.type, evt));
            hit.target.focus();
            return;
        }
    }
};

// const nonSpatialInputSource = defineQuery([InputSourceComponent, Not(TransformComponent)]);

export function assignInputSources(sourceEid, capturedEntity, data, heuristic) {
    const isSpatialInput = hasComponent(sourceEid || {}, TransformComponent);

    const intersectionData = new Set([]);

    if (isSpatialInput) heuristic.raycastedInput(sourceEid, intersectionData, data, heuristic);

    const sortedIntersections = Array.from(intersectionData).sort((a, b) => {
        // - if a < b
        // + if a > b
        // 0 if equal
        const aNum = hasComponent(a.entity, TransformGizmoTagComponent) ? -1 : 0;
        const bNum = hasComponent(b.entity, TransformGizmoTagComponent) ? -1 : 0;
        //aNum - bNum : 0 if equal, -1 if a has tag and b doesn't, 1 if a doesnt have tag and b does
        return Math.sign(a.distance - b.distance) + (aNum - bNum);
    });
    const sourceState = getMutableComponent(sourceEid, InputSourceComponent);

    //TODO check all inputSources sorted by distance list of InputComponents from query, probably similar to the spatialInputQuery
    //Proximity check ONLY if we have no raycast results, as it is always lower priority
    if (
        capturedEntity === UndefinedEntity &&
        sortedIntersections.length === 0 &&
        !hasComponent(sourceEid, InputPointerComponent)
    ) {
        heuristic.proximity(isSpatialInput, sourceEid, sortedIntersections, intersectionData);
    }

    const inputPointerComponent = getOptionalComponent(sourceEid, InputPointerComponent);
    if (inputPointerComponent) {
        sortedIntersections.push({ entity: inputPointerComponent.cameraEntity, distance: 0 });
    }

    sourceState.intersections.set(sortedIntersections);

    // const finalInputSources = Array.from(new Set([sourceEid, ...nonSpatialInputSource()]));

    //if we have a capturedEntity, only run on the capturedEntity, not the sortedIntersections
    if (capturedEntity !== UndefinedEntity) {
        // ClientInputFunctions.setInputSources(capturedEntity, finalInputSources);
    } else {
        for (const intersection of sortedIntersections) {
            // ClientInputFunctions.setInputSources(intersection.entity, finalInputSources);
        }
    }
}

export const ClientInputFunctions = {
    preventDefault,
    preventDefaultKeyDown,
    updateGamepadInput,
    setInputSources,
    updatePointerDragging,
    cleanupButton,
    redirectPointerEventsToXRUI,
    assignInputSources,
};
export default ClientInputFunctions;
