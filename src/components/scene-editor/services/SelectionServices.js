import { useEffect } from "react";

import { UUIDComponent } from "../../../ecs";
import { removeComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { entityExists } from "../../../ecs/EntityFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { PresentationSystemGroup } from "../../../ecs/SystemGroups";
import { SelectTagComponent } from "../../../engine/scene/components/SelectTagComponent";
import { MaterialSelectionState } from "../../../engine/scene/materials/MaterialLibraryState";
import { defineState, getMutableState, getState, useHookstate } from "../../../hyperflux";

export const SelectionState = defineState({
    name: "SelectionState",
    initial: {
        selectedEntities: [],
    },
    updateSelection: selectedEntities => {
        getMutableState(MaterialSelectionState).selectedMaterial.set(null);
        getMutableState(SelectionState).merge({
            selectedEntities: selectedEntities,
        });
    },
    getSelectedEntities: () => {
        return getState(SelectionState).selectedEntities.map(UUIDComponent.getEntityByUUID);
    },

    useSelectedEntities: () => {
        return useHookstate(getMutableState(SelectionState).selectedEntities).value.map(
            UUIDComponent.getEntityByUUID,
        );
    },
});

const reactor = () => {
    const selectedEntities = useHookstate(getMutableState(SelectionState).selectedEntities);

    useEffect(() => {
        const entities = [...selectedEntities.value].map(UUIDComponent.getEntityByUUID);
        for (const entity of entities) {
            if (!entityExists(entity)) continue;
            setComponent(entity, SelectTagComponent);
        }

        return () => {
            for (const entity of entities) {
                if (!entityExists(entity)) continue;
                removeComponent(entity, SelectTagComponent);
            }
        };
    }, [selectedEntities.length]);

    return null;
};

export const EditorSelectionReceptorSystem = defineSystem({
    uuid: "ee.engine.EditorSelectionReceptorSystem",
    insert: { before: PresentationSystemGroup },
    reactor,
});
