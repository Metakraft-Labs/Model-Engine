import { Vector2 } from "three";

import {
    defineComponent,
    defineQuery,
    getComponent,
    UndefinedEntity,
    useQuery,
} from "../../../ecs";
import { defineState, getState } from "../../../hyperflux";

export const InputPointerState = defineState({
    name: "InputPointerState",
    initial() {
        return {
            pointers: new Map(),
        };
    },
});

export const InputPointerComponent = defineComponent({
    name: "InputPointerComponent",

    onInit: () => {
        return {
            pointerId: -1,
            position: new Vector2(),
            lastPosition: new Vector2(),
            movement: new Vector2(),
            cameraEntity: UndefinedEntity,
        };
    },

    onSet(_entity, component, args) {
        component.pointerId.set(args.pointerId);
        component.cameraEntity.set(args.cameraEntity);
        const pointerHash = `canvas-${args.cameraEntity}.pointer-${args.pointerId}`;
        getState(InputPointerState).pointers.set(pointerHash, entity);
    },

    onRemove(entity, component) {
        const pointerHash = `canvas-${component.cameraEntity}.pointer-${component.pointerId}`;
        getState(InputPointerState).pointers.delete(pointerHash);
    },

    getPointersForCamera(cameraEntity) {
        return pointerQuery().filter(
            entity => getComponent(entity, InputPointerComponent).cameraEntity === cameraEntity,
        );
    },

    usePointersForCamera(cameraEntity) {
        const pointers = useQuery([InputPointerComponent]);
        return pointers.filter(
            entity => getComponent(entity, InputPointerComponent).cameraEntity === cameraEntity,
        );
    },

    getPointerByID(cameraEntity, pointerId) {
        const pointerHash = `canvas-${cameraEntity}.pointer-${pointerId}`;
        return getState(InputPointerState).pointers.get(pointerHash) ?? UndefinedEntity;
    },
});

const pointerQuery = defineQuery([InputPointerComponent]);
