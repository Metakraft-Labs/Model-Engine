import { Raycaster } from "three";

import { defineQuery } from "../../../ecs";
import { defineComponent, getComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { getState } from "../../../hyperflux";

import { XRHandComponent, XRSpaceComponent } from "../../xr/XRComponents";
import { ReferenceSpace, XRState } from "../../xr/XRState";
import { InputState } from "../state/InputState";

export const InputSourceComponent = defineComponent({
    name: "InputSourceComponent",

    onInit: () => {
        return {
            source: {},
            buttons: {},
            raycaster: new Raycaster(),
            intersections: [],
        };
    },

    onSet: (entity, component, args = {}) => {
        const source = args.source ?? {
            handedness: "none",
            targetRayMode: "screen",
            targetRaySpace: {},
            gripSpace: undefined,
            gamepad: args.gamepad ?? {
                axes: [0, 0, 0, 0],
                buttons: [],
                connected: true,
                hapticActuators: [],
                id: "emulated-gamepad-" + entity,
                index: 0,
                mapping: "",
                timestamp: performance.now(),
                vibrationActuator: null,
            },
            profiles: [],
            hand: undefined,
        };

        component.source.set(source);

        // if we have a real input source, we should add the XRSpaceComponent
        if (args.source?.targetRaySpace) {
            InputSourceComponent.entitiesByInputSource.set(args.source, entity);
            const space = args.source.targetRaySpace;
            const baseSpace =
                args.source.targetRayMode === "tracked-pointer"
                    ? ReferenceSpace.localFloor
                    : ReferenceSpace.viewer;
            if (!baseSpace) throw new Error("Base space not found");
            setComponent(entity, XRSpaceComponent, { space, baseSpace });
        }

        if (source.hand) {
            setComponent(entity, XRHandComponent);
        }
    },

    nonCapturedInputSources(entities = inputSourceQuery()) {
        return entities.filter(eid => eid !== getState(InputState).capturingEntity);
    },
    getPreferredInputSource: (offhand = false) => {
        const xrState = getState(XRState);
        if (!xrState.sessionActive) return;
        const avatarInputSettings = getState(InputState);
        for (const inputSourceEntity of inputSourceQuery()) {
            const inputSourceComponent = getComponent(inputSourceEntity, InputSourceComponent);
            const source = inputSourceComponent.source;
            if (source?.handedness === "none") continue;
            if (!offhand && avatarInputSettings.preferredHand == source?.handedness) return source;
            if (offhand && avatarInputSettings.preferredHand !== source?.handedness) return source;
        }
    },

    getClosestIntersectedEntity(inputSourceEntity) {
        return getComponent(inputSourceEntity, InputSourceComponent).intersections[0]?.entity;
    },

    getClosestIntersection(inputSourceEntity) {
        return getComponent(inputSourceEntity, InputSourceComponent).intersections[0];
    },

    entitiesByInputSource: new WeakMap(),
});

const inputSourceQuery = defineQuery([InputSourceComponent]);
