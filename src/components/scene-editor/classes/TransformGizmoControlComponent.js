import { useEffect } from "react";
import { MathUtils, Quaternion, Vector3 } from "three";

import {
    defineComponent,
    Engine,
    getComponent,
    removeComponent,
    setComponent,
    UndefinedEntity,
    useComponent,
    useEntityContext,
} from "../../../ecs";
import {
    SnapMode,
    TransformMode,
    TransformSpace,
} from "../../../engine/scene/constants/transformConstants";
import { getState, matches, useImmediateEffect, useMutableState } from "../../../hyperflux";
import {
    InputComponent,
    InputExecutionOrder,
} from "../../../spatial/input/components/InputComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";
import { TransformGizmoTagComponent } from "../../../spatial/transform/components/TransformComponent";

import { InputPointerComponent } from "../../../spatial/input/components/InputPointerComponent";
import { InputState } from "../../../spatial/input/state/InputState";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { gizmoPlane } from "../constants/GizmoPresets";
import {
    onGizmoCommit,
    onPointerDown,
    onPointerHover,
    onPointerLost,
    onPointerMove,
    onPointerUp,
} from "../functions/gizmoHelper";
import { EditorHelperState } from "../services/EditorHelperState";
import { TransformGizmoVisualComponent } from "./TransformGizmoVisualComponent";

export const TransformGizmoControlComponent = defineComponent({
    name: "TransformGizmoControl",

    onInit(_entity) {
        const control = {
            controlledEntities: [],
            visualEntity: UndefinedEntity,
            planeEntity: UndefinedEntity,
            pivotEntity: UndefinedEntity,
            enabled: true,
            dragging: false,
            axis: null,
            space: TransformSpace.world,
            mode: TransformMode.translate,
            translationSnap: null,
            rotationSnap: null,
            scaleSnap: null,
            size: 1,
            showX: true,
            showY: true,
            showZ: true,
            worldPosition: new Vector3(),
            worldPositionStart: new Vector3(),
            worldQuaternion: new Quaternion(),
            worldQuaternionStart: new Quaternion(),
            pointStart: new Vector3(),
            pointEnd: new Vector3(),
            rotationAxis: new Vector3(),
            rotationAngle: 0,
            eye: new Vector3(),
        };
        return control;
    },
    onSet(_entity, component, json) {
        if (!json) return;

        if (matches.array.test(json.controlledEntities))
            component.controlledEntities.set(json.controlledEntities);
        if (matches.number.test(json.visualEntity)) component.visualEntity.set(json.visualEntity);
        if (matches.number.test(json.pivotEntity)) component.pivotEntity.set(json.pivotEntity);
        if (matches.number.test(json.planeEntity)) component.planeEntity.set(json.planeEntity);

        if (typeof json.enabled === "boolean") component.enabled.set(json.enabled);
        if (typeof json.dragging === "boolean") component.dragging.set(json.dragging);
        if (typeof json.axis === "string") component.axis.set(json.axis);
        if (typeof json.space === "string") component.space.set(json.space);
        if (typeof json.mode === "string") component.mode.set(json.mode);
        if (typeof json.translationSnap === "number")
            component.translationSnap.set(json.translationSnap);
        if (typeof json.rotationSnap === "number") component.rotationSnap.set(json.rotationSnap);
        if (typeof json.scaleSnap === "number") component.scaleSnap.set(json.scaleSnap);
        if (typeof json.size === "number") component.size.set(json.size);
        if (typeof json.showX === "number") component.showX.set(json.showX);
        if (typeof json.showY === "number") component.showY.set(json.showY);
        if (typeof json.showZ === "number") component.showZ.set(json.showZ);
    },
    onRemove: (_entity, component) => {
        component.controlledEntities.set([]);
        component.visualEntity.set(UndefinedEntity);
        component.planeEntity.set(UndefinedEntity);
        component.pivotEntity.set(UndefinedEntity);
    },
    reactor: function () {
        const gizmoControlEntity = useEntityContext();
        const gizmoControlComponent = useComponent(
            gizmoControlEntity,
            TransformGizmoControlComponent,
        );
        getComponent(
            Engine.instance.viewerEntity,
            RendererComponent,
        ).renderer.domElement.style.touchAction = "none"; // disable touch scroll , hmm the editor window isnt scrollable anyways
        const editorHelperState = useMutableState(EditorHelperState);
        const inputPointerEntities = InputPointerComponent.usePointersForCamera(
            Engine.instance.viewerEntity,
        );

        // Commit transform changes if the pointer entities are lost (ie. pointer dragged outside of the canvas)
        useImmediateEffect(() => {
            const gizmoControlComponent = getComponent(
                gizmoControlEntity,
                TransformGizmoControlComponent,
            );
            if (
                !gizmoControlComponent.enabled ||
                !gizmoControlComponent.visualEntity ||
                !gizmoControlComponent.planeEntity ||
                !gizmoControlComponent.dragging ||
                inputPointerEntities.length
            )
                return;

            onGizmoCommit(gizmoControlEntity);
            removeComponent(gizmoControlComponent.planeEntity, VisibleComponent);
        }, [inputPointerEntities]);

        InputComponent.useExecuteWithInput(
            () => {
                const gizmoControlComponent = getComponent(
                    gizmoControlEntity,
                    TransformGizmoControlComponent,
                );

                if (
                    !gizmoControlComponent.enabled ||
                    !gizmoControlComponent.visualEntity ||
                    !gizmoControlComponent.planeEntity
                )
                    return;

                const visualComponent = getComponent(
                    gizmoControlComponent.visualEntity,
                    TransformGizmoVisualComponent,
                );
                const pickerEntity = visualComponent.picker[gizmoControlComponent.mode];

                onPointerHover(gizmoControlEntity);

                const pickerButtons = InputComponent.getMergedButtons(pickerEntity);
                const planeButtons = InputComponent.getMergedButtons(
                    gizmoControlComponent.planeEntity,
                );

                if (
                    (pickerButtons?.PrimaryClick?.pressed || planeButtons?.PrimaryClick?.pressed) &&
                    getState(InputState).capturingEntity === UndefinedEntity
                ) {
                    InputState.setCapturingEntity(pickerEntity);
                    onPointerMove(gizmoControlEntity);

                    //pointer down
                    if (pickerButtons?.PrimaryClick?.down) {
                        setComponent(gizmoControlComponent.planeEntity, VisibleComponent);
                        onPointerDown(gizmoControlEntity);
                    }

                    if (planeButtons?.PrimaryClick?.up || pickerButtons?.PrimaryClick?.up) {
                        onPointerUp(gizmoControlEntity);
                        onPointerLost(gizmoControlEntity);
                        removeComponent(gizmoControlComponent.planeEntity, VisibleComponent);
                    }
                }
            },
            true,
            InputExecutionOrder.Before,
        );

        useEffect(() => {
            addObjectToGroup(gizmoControlComponent.planeEntity.value, gizmoPlane);
            gizmoPlane.layers.set(ObjectLayers.TransformGizmo);
            setComponent(gizmoControlComponent.planeEntity.value, InputComponent);
            setComponent(gizmoControlComponent.planeEntity.value, TransformGizmoTagComponent);
        }, []);

        useEffect(() => {
            const mode = editorHelperState.transformMode.value;
            gizmoControlComponent.mode.set(mode);
        }, [editorHelperState.transformMode]);

        useEffect(() => {
            const space = editorHelperState.transformSpace.value;
            gizmoControlComponent.space.set(space);
        }, [editorHelperState.transformSpace]);

        useEffect(() => {
            switch (editorHelperState.gridSnap.value) {
                case SnapMode.Disabled: // continous update
                    gizmoControlComponent.translationSnap.set(0);
                    gizmoControlComponent.rotationSnap.set(0);
                    gizmoControlComponent.scaleSnap.set(0);
                    break;
                case SnapMode.Grid:
                    gizmoControlComponent.translationSnap.set(
                        editorHelperState.translationSnap.value,
                    );
                    gizmoControlComponent.rotationSnap.set(
                        MathUtils.degToRad(editorHelperState.rotationSnap.value),
                    );
                    gizmoControlComponent.scaleSnap.set(editorHelperState.scaleSnap.value);
                    break;
            }
        }, [editorHelperState.gridSnap]);

        useEffect(() => {
            gizmoControlComponent.translationSnap.set(
                editorHelperState.gridSnap.value === SnapMode.Grid
                    ? editorHelperState.translationSnap.value
                    : 0,
            );
        }, [editorHelperState.translationSnap]);

        useEffect(() => {
            gizmoControlComponent.rotationSnap.set(
                editorHelperState.gridSnap.value === SnapMode.Grid
                    ? MathUtils.degToRad(editorHelperState.rotationSnap.value)
                    : 0,
            );
        }, [editorHelperState.rotationSnap]);

        useEffect(() => {
            gizmoControlComponent.scaleSnap.set(
                editorHelperState.gridSnap.value === SnapMode.Grid
                    ? editorHelperState.scaleSnap.value
                    : 0,
            );
        }, [editorHelperState.scaleSnap]);

        return null;
    },
});
