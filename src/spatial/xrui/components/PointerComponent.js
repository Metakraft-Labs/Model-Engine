import { useEffect } from "react";
import {
    BufferGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    SphereGeometry,
} from "three";
import matches from "ts-matches";

import {
    defineComponent,
    getComponent,
    getMutableComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import {
    createEntity,
    entityExists,
    removeEntity,
    useEntityContext,
} from "../../../ecs/EntityFunctions";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";

import { getState } from "../../../hyperflux";
import { EngineState } from "../../EngineState";
import { NameComponent } from "../../common/NameComponent";
import { useAnimationTransition } from "../../common/functions/createTransitionState";
import { InputSourceComponent } from "../../input/components/InputSourceComponent";
import { addObjectToGroup, removeObjectFromGroup } from "../../renderer/components/GroupComponent";
import { VisibleComponent } from "../../renderer/components/VisibleComponent";
import { ComputedTransformComponent } from "../../transform/components/ComputedTransformComponent";
import { TransformComponent } from "../../transform/components/TransformComponent";

export const PointerComponent = defineComponent({
    name: "PointerComponent",

    onInit: entity => {
        return {
            inputSource,
            lastHit,
            // internal
            pointer,
            cursor,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (matches.object.test(json.inputSource)) component.inputSource.set(json.inputSource);
    },

    onRemove: (entity, component) => {
        PointerComponent.pointers.delete(component.inputSource.value);
    },

    reactor: () => {
        const entity = useEntityContext();
        const pointerComponentState = useComponent(entity, PointerComponent);

        const transition = useAnimationTransition(0.5, "OUT", alpha => {
            const cursorMaterial = pointerComponentState.cursor.value?.materialBasicMaterial;
            const pointerMaterial = pointerComponentState.pointer.value?.materialBasicMaterial;
            if (cursorMaterial) {
                cursorMaterial.opacity = alpha;
                cursorMaterial.visible = alpha > 0;
            }
            if (pointerMaterial) {
                pointerMaterial.opacity = alpha;
                pointerMaterial.visible = alpha > 0;
            }
        });

        useEffect(() => {
            const inputSource = pointerComponentState.inputSource.value;
            const pointer = createPointer(inputSource);
            const cursor = createUICursor();
            const pointerEntity = createEntity();
            addObjectToGroup(pointerEntity, pointer);
            setComponent(pointerEntity, EntityTreeComponent, { parentEntity: entity });
            addObjectToGroup(pointerEntity, cursor);
            getMutableComponent(entity, PointerComponent).merge({ pointer, cursor });
            addObjectToGroup(entity, pointer);
            return () => {
                if (entityExists(entity)) removeObjectFromGroup(entity, pointer);
                removeEntity(pointerEntity);
            };
        }, [pointerComponentState.inputSource]);

        useEffect(() => {
            transition(pointerComponentState.lastHit.value ? "IN" : "OUT");
        }, [pointerComponentState.lastHit]);

        return null;
    },

    addPointer: inputSourceEntity => {
        const inputSource = getComponent(inputSourceEntity, InputSourceComponent).source;
        const entity = createEntity();
        setComponent(entity, PointerComponent, { inputSource });
        setComponent(entity, NameComponent, "Pointer" + inputSource.handedness);
        setComponent(entity, EntityTreeComponent, {
            parentEntity: getState(EngineState).localFloorEntity,
        });
        setComponent(entity, ComputedTransformComponent, {
            referenceEntities: [inputSourceEntity],
            computeFunction: () => {
                const inputTransform = getComponent(inputSourceEntity, TransformComponent);
                const pointerTransform = getComponent(entity, TransformComponent);
                pointerTransform.position.copy(inputTransform.position);
                pointerTransform.rotation.copy(inputTransform.rotation);
            },
        });

        setComponent(entity, TransformComponent);
        setComponent(entity, VisibleComponent);
        PointerComponent.pointers.set(inputSource, entity);
    },

    pointers: new Map(),

    getPointers: () => {
        return Array.from(PointerComponent.pointers.values()).map(
            entity => getComponent(entity, PointerComponent).pointer,
        );
    },
});

// pointer taken from https://github.com/mrdoob/three.js/blob/master/examples/webxr_vr_ballshooter.html
const createPointer = inputSource => {
    switch (inputSource.targetRayMode) {
        case "gaze": {
            const geometry = new RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
            const material = new MeshBasicMaterial({ opacity: 0, transparent: true });
            return new Mesh(geometry, material);
        }
        default:
        case "tracked-pointer": {
            const geometry = new BufferGeometry();
            geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
            geometry.setAttribute("color", new Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));
            const material = new LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0,
                linewidth: 2,
            });
            return new Line(geometry, material);
        }
    }
};

const createUICursor = () => {
    const geometry = new SphereGeometry(0.01, 16, 16);
    const material = new MeshBasicMaterial({ color: 0xffffff, opacity: 0 });
    return new Mesh(geometry, material);
};
