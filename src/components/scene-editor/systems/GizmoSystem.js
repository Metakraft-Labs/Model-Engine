import { useEffect } from "react";

import { getComponent, removeComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { AnimationSystemGroup } from "../../../ecs/SystemGroups";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";

import { TransformGizmoControlComponent } from "../classes/TransformGizmoControlComponent";
import { TransformGizmoControlledComponent } from "../classes/TransformGizmoControlledComponent";
import { controlUpdate, gizmoUpdate, planeUpdate } from "../functions/gizmoHelper";
import { SelectionState } from "../services/SelectionServices";

const sourceQuery = defineQuery([SourceComponent, TransformGizmoControlledComponent]);
export const transformGizmoControllerQuery = defineQuery([TransformGizmoControlComponent]);
export const transformGizmoControlledQuery = defineQuery([TransformGizmoControlledComponent]);

const execute = () => {
    for (const gizmoEntity of transformGizmoControllerQuery()) {
        const gizmoControlComponent = getComponent(gizmoEntity, TransformGizmoControlComponent);
        if (!gizmoControlComponent.enabled) return;

        if (!gizmoControlComponent.visualEntity) return;
        gizmoUpdate(gizmoEntity);
        if (!gizmoControlComponent.planeEntity) return;
        planeUpdate(gizmoEntity);
        controlUpdate(gizmoEntity);
    }
};

const reactor = () => {
    const selectedEntities = SelectionState.useSelectedEntities();

    for (const entity of sourceQuery()) removeComponent(entity, TransformGizmoControlledComponent);

    useEffect(() => {
        if (!selectedEntities) return;
        const lastSelection = selectedEntities[selectedEntities.length - 1];
        if (!lastSelection) return;
        setComponent(lastSelection, TransformGizmoControlledComponent);
    }, [selectedEntities]);

    return null;
};

export const GizmoSystem = defineSystem({
    uuid: "ee.editor.GizmoSystem",
    insert: { with: AnimationSystemGroup },
    execute,
    reactor,
});
