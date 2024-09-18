import { useLayoutEffect } from "react";

import {
    defineSystem,
    getComponent,
    getOptionalComponent,
    InputSystemGroup,
    UndefinedEntity,
    useExecute,
} from "../../../ecs";
import {
    defineComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { getState, useHookstate } from "../../../hyperflux";
import { EngineState } from "../../EngineState";
import { HighlightComponent } from "../../renderer/components/HighlightComponent";
import { getAncestorWithComponent, isAncestor } from "../../transform/components/EntityTree";
import {
    AxisMapping,
    KeyboardButton,
    MouseButton,
    MouseScroll,
    XRStandardGamepadAxes,
    XRStandardGamepadButton,
} from "../state/ButtonState";
import { InputState } from "../state/InputState";
import { InputSinkComponent } from "./InputSinkComponent";
import { InputSourceComponent } from "./InputSourceComponent";

export const InputExecutionOrder = {
    Before: -1,
    With: 0,
    After: 1,
};

export const DefaultButtonAlias = {
    Interact: [
        MouseButton.PrimaryClick,
        XRStandardGamepadButton.XRStandardGamepadTrigger,
        KeyboardButton.KeyE,
    ],
    FollowCameraModeCycle: [KeyboardButton.KeyV],
    FollowCameraFirstPerson: [KeyboardButton.KeyF],
    FollowCameraShoulderCam: [KeyboardButton.KeyC],
};

export const DefaultAxisAlias = {
    FollowCameraZoomScroll: [
        MouseScroll.VerticalScroll,
        XRStandardGamepadAxes.XRStandardGamepadThumbstickY,
        XRStandardGamepadAxes.XRStandardGamepadTouchpadY,
    ],
    FollowCameraShoulderCamScroll: [MouseScroll.HorizontalScroll],
};

export const InputComponent = defineComponent({
    name: "InputComponent",
    jsonID: "EE_input",

    onInit: () => {
        return {
            inputSinks: ["Self"],
            activationDistance: 2,
            highlight: false,
            grow: false,

            //internal
            /** populated automatically by ClientInputSystem */
            inputSources: [],
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;
        if (Array.isArray(json.inputSinks)) component.inputSinks.set(json.inputSinks);
        if (typeof json.highlight === "boolean") component.highlight.set(json.highlight);
        if (json.activationDistance) component.activationDistance.set(json.activationDistance);
        if (typeof json.grow === "boolean") component.grow.set(json.grow);
    },

    toJSON: (_entity, component) => {
        return {
            inputSinks: component.inputSinks.value,
            activationDistance: component.activationDistance.value,
        };
    },

    useExecuteWithInput(
        executeOnInput,
        executeWhenEditing = false,
        order = InputExecutionOrder.With,
    ) {
        const entity = useEntityContext();

        return useExecute(() => {
            const capturingEntity = getState(InputState).capturingEntity;
            if (
                (!executeWhenEditing && getState(EngineState).isEditing) ||
                (capturingEntity && !isAncestor(capturingEntity, entity, true))
            )
                return;
            executeOnInput();
        }, getInputExecutionInsert(order));
    },

    getInputEntities(entityContext) {
        const inputSinkEntity = getAncestorWithComponent(entityContext, InputSinkComponent);
        const closestInputEntity = getAncestorWithComponent(entityContext, InputComponent);
        const inputSinkInputEntities =
            getOptionalComponent(inputSinkEntity, InputSinkComponent)?.inputEntities ?? [];
        const inputEntities = [closestInputEntity, ...inputSinkInputEntities];
        return inputEntities.filter(
            (entity, index) =>
                inputEntities.indexOf(entity) === index && entity !== UndefinedEntity,
        ); // remove duplicates
    },

    getInputSourceEntities(entityContext) {
        const inputEntities = InputComponent.getInputEntities(entityContext);
        return inputEntities.reduce((prev, eid) => {
            return [...prev, ...getComponent(eid, InputComponent).inputSources];
        }, []);
    },

    getMergedButtons(entityContext, inputAlias = DefaultButtonAlias) {
        const inputSourceEntities = InputComponent.getInputSourceEntities(entityContext);
        return InputComponent.getMergedButtonsForInputSources(inputSourceEntities, inputAlias);
    },

    getMergedAxes(entityContext, inputAlias = DefaultAxisAlias) {
        const inputSourceEntities = InputComponent.getInputSourceEntities(entityContext);
        return InputComponent.getMergedAxesForInputSources(inputSourceEntities, inputAlias);
    },

    getMergedButtonsForInputSources(inputSourceEntities, inputAlias = DefaultButtonAlias) {
        const buttons = Object.assign(
            {},
            ...inputSourceEntities.map(eid => {
                return getComponent(eid, InputSourceComponent).buttons;
            }),
        );

        for (const key of Object.keys(inputAlias)) {
            const k = key;
            buttons[k] = inputAlias[key].reduce((acc, alias) => acc || buttons[alias], undefined);
        }

        return buttons;
    },

    getMergedAxesForInputSources(inputSourceEntities, inputAlias = DefaultAxisAlias) {
        const axes = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
        };

        for (const eid of inputSourceEntities) {
            const inputSource = getComponent(eid, InputSourceComponent);
            if (inputSource.source.gamepad?.axes) {
                const mapping = AxisMapping[inputSource.source.gamepad.mapping];
                for (let i = 0; i < 4; i++) {
                    const newAxis = inputSource.source.gamepad.axes[i] ?? 0;
                    axes[i] = getLargestMagnitudeNumber(axes[i] ?? 0, newAxis);
                    axes[mapping[i]] = axes[i];
                }
            }
        }

        for (const key of Object.keys(inputAlias)) {
            axes[key] =
                inputAlias[key].reduce <
                number >
                ((prev, alias) => {
                    return getLargestMagnitudeNumber(prev, axes[alias] ?? 0);
                },
                0);
        }

        return axes;
    },

    useHasFocus() {
        const entity = useEntityContext();
        const hasFocus = useHookstate(() => {
            return InputComponent.getInputSourceEntities(entity).length > 0;
        });
        useExecute(
            () => {
                const inputSources = InputComponent.getInputSourceEntities(entity);
                hasFocus.set(inputSources.length > 0);
            },
            // we want to evaluate input sources after the input system group has run, after all input systems
            // have had a chance to respond to input and/or capture input sources
            { after: InputSystemGroup },
        );
        return hasFocus;
    },

    reactor: () => {
        const entity = useEntityContext();
        const input = useComponent(entity, InputComponent);

        useLayoutEffect(() => {
            if (!input.inputSources.length || !input.highlight.value) return;
            setComponent(entity, HighlightComponent);
            return () => {
                removeComponent(entity, HighlightComponent);
            };
        }, [input.inputSources, input.highlight]);

        return null;
    },
});

function getLargestMagnitudeNumber(a, b) {
    return Math.abs(a) > Math.abs(b) ? a : b;
}

function getInputExecutionInsert(order) {
    switch (order) {
        case InputExecutionOrder.Before:
            return { before: InputExecutionSystemGroup };
        case InputExecutionOrder.After:
            return { after: InputExecutionSystemGroup };
        default:
            return { with: InputExecutionSystemGroup };
    }
}

/** System for inserting subsystems*/
export const InputExecutionSystemGroup = defineSystem({
    uuid: "ee.engine.InputExecutionSystemGroup",
    insert: { with: InputSystemGroup },
});
