/**
 * @fileoverview
 * Contains declarations for the functions and hooks used by ClientInputSystem.reactor.
 */

import { useEffect } from "react";
import { Vector3 } from "three";
import {
    createEntity,
    Engine,
    getComponent,
    getOptionalComponent,
    removeEntity,
    setComponent,
    useEntityContext,
} from "../../../ecs";
import { getState, useImmediateEffect, useMutableState } from "../../../hyperflux";
import { NameComponent } from "../../common/NameComponent";
import { RendererComponent } from "../../renderer/WebGLRendererSystem";
import { TransformComponent } from "../../SpatialModule";
import {
    EntityTreeComponent,
    useAncestorWithComponent,
} from "../../transform/components/EntityTree";
import { XRState } from "../../xr/XRState";
import { InputComponent } from "../components/InputComponent";
import { InputPointerComponent } from "../components/InputPointerComponent";
import { InputSourceComponent } from "../components/InputSourceComponent";
import { createInitialButtonState, MouseButton } from "../state/ButtonState";
import { InputState } from "../state/InputState";
import ClientInputFunctions from "./ClientInputFunctions";
import normalizeWheel from "./normalizeWheel";

export const useNonSpatialInputSources = () => {
    useEffect(() => {
        const eid = createEntity();
        setComponent(eid, InputSourceComponent, {});
        setComponent(eid, NameComponent, "InputSource-nonspatial");
        const inputSourceComponent = getComponent(eid, InputSourceComponent);

        document.addEventListener("DOMMouseScroll", ClientInputFunctions.preventDefault, false);
        document.addEventListener("gesturestart", ClientInputFunctions.preventDefault);
        document.addEventListener("keydown", ClientInputFunctions.preventDefaultKeyDown, false);

        const onKeyEvent = event => {
            ClientInputFunctions.preventDefaultKeyDown(event);
            const element = event.target;
            // Сheck which excludes the possibility of controlling the avatar when typing in a text field
            if (
                element?.tagName === "INPUT" ||
                element?.tagName === "SELECT" ||
                element?.tagName === "TEXTAREA"
            )
                return;

            const code = event.code;
            const down = event.type === "keydown";

            const buttonState = inputSourceComponent.buttons;
            if (down) buttonState[code] = createInitialButtonState(eid);
            else if (buttonState[code]) buttonState[code].up = true;
        };
        document.addEventListener("keyup", onKeyEvent);
        document.addEventListener("keydown", onKeyEvent);

        const handleTouchDirectionalPad = event => {
            const { stick, value } = event.detail;
            if (!stick) return;
            const index = stick === "LeftStick" ? 0 : 2;
            const axes = inputSourceComponent.source.gamepad.axes;
            axes[index + 0] = value.x;
            axes[index + 1] = value.y;
        };
        document.addEventListener("touchstickmove", handleTouchDirectionalPad);

        document.addEventListener("touchgamepadbuttondown", event => {
            const buttonState = inputSourceComponent.buttons;
            buttonState[event.detail.button] = createInitialButtonState(eid);
        });

        document.addEventListener("touchgamepadbuttonup", event => {
            const buttonState = inputSourceComponent.buttons;
            if (buttonState[event.detail.button]) buttonState[event.detail.button].up = true;
        });

        return () => {
            document.removeEventListener(
                "DOMMouseScroll",
                ClientInputFunctions.preventDefault,
                false,
            );
            document.removeEventListener("gesturestart", ClientInputFunctions.preventDefault);
            document.removeEventListener("keyup", onKeyEvent);
            document.removeEventListener("keydown", onKeyEvent);
            document.removeEventListener("touchstickmove", handleTouchDirectionalPad);
            removeEntity(eid);
        };
    }, []);
};

export const useGamepadInputSources = () => {
    useEffect(() => {
        const addGamepad = e => {
            console.log("[ClientInputSystem] found gamepad", e.gamepad);
            const eid = createEntity();
            setComponent(eid, InputSourceComponent, { gamepad: e.gamepad });
            setComponent(eid, NameComponent, "InputSource-gamepad-" + e.gamepad.id);
        };
        const removeGamepad = e => {
            console.log("[ClientInputSystem] lost gamepad", e.gamepad);
            NameComponent.entitiesByName["InputSource-gamepad-" + e.gamepad.id]?.forEach(
                removeEntity,
            );
        };
        window.addEventListener("gamepadconnected", addGamepad);
        window.addEventListener("gamepaddisconnected", removeGamepad);
        return () => {
            window.removeEventListener("gamepadconnected", addGamepad);
            window.removeEventListener("gamepaddisconnected", removeGamepad);
        };
    }, []);
};

export const useXRInputSources = () => {
    const xrState = useMutableState(XRState);

    useEffect(() => {
        const session = xrState.session.value;
        if (!session) return;

        const addInputSource = source => {
            const eid = createEntity();
            setComponent(eid, InputSourceComponent, { source });
            setComponent(eid, EntityTreeComponent, {
                parentEntity:
                    source.targetRayMode === "tracked-pointer"
                        ? Engine.instance.localFloorEntity
                        : Engine.instance.viewerEntity,
            });
            setComponent(eid, TransformComponent);
            setComponent(
                eid,
                NameComponent,
                "InputSource-handed:" + source.handedness + "-mode:" + source.targetRayMode,
            );
        };

        const removeInputSource = source => {
            const entity = InputSourceComponent.entitiesByInputSource.get(source);
            if (entity) removeEntity(entity);
        };

        if (session.inputSources) {
            for (const inputSource of session.inputSources) addInputSource(inputSource);
        }

        const onInputSourcesChanged = event => {
            event.added.map(addInputSource);
            event.removed.map(removeInputSource);
        };

        const onXRSelectStart = event => {
            const eid = InputSourceComponent.entitiesByInputSource.get(event.inputSource);
            if (!eid) return;
            const inputSourceComponent = getComponent(eid, InputSourceComponent);
            if (!inputSourceComponent) return;
            const state = inputSourceComponent.buttons;
            state.PrimaryClick = createInitialButtonState(eid);
        };
        const onXRSelectEnd = event => {
            const eid = InputSourceComponent.entitiesByInputSource.get(event.inputSource);
            if (!eid) return;
            const inputSourceComponent = getComponent(eid, InputSourceComponent);
            if (!inputSourceComponent) return;
            const state = inputSourceComponent.buttons;
            if (!state.PrimaryClick) return;
            state.PrimaryClick.up = true;
        };

        session.addEventListener("inputsourceschange", onInputSourcesChanged);
        session.addEventListener("selectstart", onXRSelectStart);
        session.addEventListener("selectend", onXRSelectEnd);

        return () => {
            session.removeEventListener("inputsourceschange", onInputSourcesChanged);
            session.removeEventListener("selectstart", onXRSelectStart);
            session.removeEventListener("selectend", onXRSelectEnd);
        };
    }, [xrState.session]);
};

export const CanvasInputReactor = () => {
    const cameraEntity = useEntityContext();
    const xrState = useMutableState(XRState);
    useEffect(() => {
        if (xrState.session.value) return; // pointer input sources are automatically handled by webxr

        const rendererComponent = getComponent(cameraEntity, RendererComponent);
        const canvas = rendererComponent.canvas;

        /** Clear mouse events */
        const pointerButtons = ["PrimaryClick", "AuxiliaryClick", "SecondaryClick"];
        const clearPointerState = entity => {
            const inputSourceComponent = getComponent(entity, InputSourceComponent);
            const state = inputSourceComponent.buttons;
            for (const button of pointerButtons) {
                const val = state[button];
                if (!val?.up && val?.pressed) state[button].up = true;
            }
        };

        const onPointerEnter = event => {
            const pointerEntity = createEntity();
            setComponent(pointerEntity, NameComponent, "InputSource-emulated-pointer");
            setComponent(pointerEntity, TransformComponent);
            setComponent(pointerEntity, InputSourceComponent);
            setComponent(pointerEntity, InputPointerComponent, {
                pointerId: event.pointerId,
                cameraEntity,
            });
            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, event);
        };

        const onPointerOver = event => {
            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, event);
        };

        const onPointerOut = event => {
            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, event);
        };

        const onPointerLeave = event => {
            const pointerEntity = InputPointerComponent.getPointerByID(
                cameraEntity,
                event.pointerId,
            );
            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, event);
            removeEntity(pointerEntity);
        };

        const onPointerClick = event => {
            const pointerEntity = InputPointerComponent.getPointerByID(
                cameraEntity,
                event.pointerId,
            );
            const inputSourceComponent = getOptionalComponent(pointerEntity, InputSourceComponent);
            if (!inputSourceComponent) return;

            const down = event.type === "pointerdown";

            let button = MouseButton.PrimaryClick;
            if (event.button === 1) button = MouseButton.AuxiliaryClick;
            else if (event.button === 2) button = MouseButton.SecondaryClick;

            const state = inputSourceComponent.buttons;
            if (down) {
                state[button] = createInitialButtonState(pointerEntity); //down, pressed, touched = true

                const pointer = getOptionalComponent(pointerEntity, InputPointerComponent);
                if (pointer) {
                    state[button].downPosition = new Vector3(
                        pointer.position.x,
                        pointer.position.y,
                        0,
                    );
                    //rotation will never be defined for the mouse or touch
                }
            } else if (state[button]) {
                state[button].up = true;
            }

            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, event);
        };

        const onPointerMove = event => {
            const pointerEntity = InputPointerComponent.getPointerByID(
                cameraEntity,
                event.pointerId,
            );
            const pointerComponent = getOptionalComponent(pointerEntity, InputPointerComponent);
            if (!pointerComponent) return;

            pointerComponent.position.set(
                ((event.clientX - canvas.getBoundingClientRect().x) / canvas.clientWidth) * 2 - 1,
                ((event.clientY - canvas.getBoundingClientRect().y) / canvas.clientHeight) * -2 + 1,
            );

            ClientInputFunctions.updatePointerDragging(pointerEntity, event);
            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, event);
        };

        const onVisibilityChange = _event => {
            if (
                document.visibilityState === "hidden" ||
                !canvas.checkVisibility({
                    checkOpacity: true,
                    checkVisibilityCSS: true,
                })
            ) {
                InputPointerComponent.getPointersForCamera(cameraEntity).forEach(clearPointerState);
            }
        };

        const onClick = evt => {
            ClientInputFunctions.redirectPointerEventsToXRUI(cameraEntity, evt);
        };

        const onWheelEvent = event => {
            const pointer = InputPointerComponent.getPointersForCamera(cameraEntity)[0];
            if (!pointer) return;
            const inputSourceComponent = getComponent(pointer, InputSourceComponent);
            const normalizedValues = normalizeWheel(event);
            const axes = inputSourceComponent.source.gamepad.axes;
            axes[0] = normalizedValues.spinX;
            axes[1] = normalizedValues.spinY;
        };

        canvas.addEventListener("dragstart", ClientInputFunctions.preventDefault, false);
        canvas.addEventListener("contextmenu", ClientInputFunctions.preventDefault);
        canvas.addEventListener("pointerenter", onPointerEnter);
        canvas.addEventListener("pointerover", onPointerOver);
        canvas.addEventListener("pointerout", onPointerOut);
        canvas.addEventListener("pointerleave", onPointerLeave);
        canvas.addEventListener("pointermove", onPointerMove, { passive: true, capture: true });
        canvas.addEventListener("pointerup", onPointerClick);
        canvas.addEventListener("pointerdown", onPointerClick);
        canvas.addEventListener("blur", onVisibilityChange);
        canvas.addEventListener("visibilitychange", onVisibilityChange);
        canvas.addEventListener("click", onClick);
        canvas.addEventListener("wheel", onWheelEvent, { passive: true, capture: true });

        return () => {
            canvas.removeEventListener("dragstart", ClientInputFunctions.preventDefault, false);
            canvas.removeEventListener("contextmenu", ClientInputFunctions.preventDefault);
            canvas.removeEventListener("pointerenter", onPointerEnter);
            canvas.removeEventListener("pointerover", onPointerOver);
            canvas.removeEventListener("pointerout", onPointerOut);
            canvas.removeEventListener("pointerleave", onPointerLeave);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", onPointerClick);
            canvas.removeEventListener("pointerdown", onPointerClick);
            canvas.removeEventListener("blur", onVisibilityChange);
            canvas.removeEventListener("visibilitychange", onVisibilityChange);
            canvas.removeEventListener("click", onClick);
            canvas.removeEventListener("wheel", onWheelEvent);
        };
    }, [xrState.session]);

    return null;
};

export const MeshInputReactor = () => {
    const entity = useEntityContext();
    const shouldReceiveInput = !!useAncestorWithComponent(entity, InputComponent);

    useImmediateEffect(() => {
        const inputState = getState(InputState);
        if (shouldReceiveInput) inputState.inputMeshes.add(entity);
        else inputState.inputMeshes.delete(entity);
    }, [shouldReceiveInput]);
    return null;
};

export const BoundingBoxInputReactor = () => {
    const entity = useEntityContext();
    const shouldReceiveInput = !!useAncestorWithComponent(entity, InputComponent);
    useImmediateEffect(() => {
        const inputState = getState(InputState);
        if (shouldReceiveInput) inputState.inputBoundingBoxes.add(entity);
        else inputState.inputBoundingBoxes.delete(entity);
    }, [shouldReceiveInput]);
    return null;
};

export const ClientInputHooks = {
    useNonSpatialInputSources,
    useGamepadInputSources,
    useXRInputSources,
    CanvasInputReactor,
    MeshInputReactor,
    BoundingBoxInputReactor,
};
export default ClientInputHooks;
