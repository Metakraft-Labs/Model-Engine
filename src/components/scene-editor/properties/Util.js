import { UUIDComponent } from "../../../ecs";
import { updateComponent } from "../../../ecs/ComponentFunctions";
import { getMutableState } from "../../../hyperflux";

import { EditorControlFunctions } from "../functions/EditorControlFunctions";
import { EditorState } from "../services/EditorServices";
import { SelectionState } from "../services/SelectionServices";

export const updateProperty = (component, propName, nodes) => {
    return value => {
        updateProperties(component, { [propName]: value }, nodes);
    };
};

export const updateProperties = (component, properties, nodes) => {
    const editorState = getMutableState(EditorState);

    const affectedNodes = nodes
        ? nodes
        : editorState.lockPropertiesPanel.value
          ? [UUIDComponent.getEntityByUUID(editorState.lockPropertiesPanel.value)]
          : SelectionState.getSelectedEntities();
    for (let i = 0; i < affectedNodes.length; i++) {
        const node = affectedNodes[i];
        updateComponent(node, component, properties);
    }
};

export const commitProperty = (component, propName, nodes) => {
    return value => {
        commitProperties(component, { [propName]: value }, nodes);
    };
};

export const commitProperties = (component, properties, nodes) => {
    const editorState = getMutableState(EditorState);

    const affectedNodes = nodes
        ? nodes
        : editorState.lockPropertiesPanel.value
          ? [UUIDComponent.getEntityByUUID(editorState.lockPropertiesPanel.value)]
          : SelectionState.getSelectedEntities();

    EditorControlFunctions.modifyProperty(affectedNodes, component, properties);
};
