import { UndefinedEntity } from "../../../ecs";

export const ButtonMapping = {
    "": MouseButton,
    keyboard: KeyboardButton,
    standard: StandardGamepadButton,
    "xr-standard": XRStandardGamepadButton,
};

export const AxisMapping = {
    "": MouseScroll,
    "xr-standard": XRStandardGamepadAxes,
    standard: StandardGamepadAxes,
};

export const DefaultBooleanButtonState = Object.freeze({
    down: true,
    pressed: true,
    touched: true,
    value: 1,
    dragging: false,
    rotating: false,
});

export const createInitialButtonState = (
    inputSourceEntity,
    initial = DefaultBooleanButtonState,
) => {
    return {
        down: initial.down ?? initial.pressed ?? false,
        pressed: initial.pressed ?? true,
        touched: initial.touched ?? true,
        dragging: initial.dragging ?? false,
        rotating: initial.rotating ?? false,
        up: initial.up ?? false,
        value: initial.value ?? 1,
        inputSource: inputSourceEntity ?? UndefinedEntity,
    };
};
