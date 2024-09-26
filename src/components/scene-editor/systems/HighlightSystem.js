import { useEffect } from "react";
import { removeComponent, setComponent } from "../../../ecs";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { AnimationSystemGroup } from "../../../ecs/SystemGroups";
import { HighlightComponent } from "../../../spatial/renderer/components/HighlightComponent";
import { SelectionState } from "../services/SelectionServices";

const reactor = () => {
    const selectedEntities = SelectionState.useSelectedEntities();

    useEffect(() => {
        if (!selectedEntities) return;
        const lastSelection = selectedEntities[selectedEntities.length - 1];
        if (!lastSelection) return;
        setComponent(lastSelection, HighlightComponent);
        return () => {
            removeComponent(lastSelection, HighlightComponent);
        };
    }, [selectedEntities]);

    return null;
};

export const HighlightSystem = defineSystem({
    uuid: "ee.editor.HighlightSystem",
    insert: { with: AnimationSystemGroup },
    reactor,
});
