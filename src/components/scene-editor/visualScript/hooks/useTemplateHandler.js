import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import { useMutableState } from "../../../../hyperflux";
import { VisualScriptState } from "../../../../visual-script";

export const useTemplateHandler = ({ selectedNodes, selectedEdges, pasteNodes, onNodesChange }) => {
    const visualScriptState = useMutableState(VisualScriptState);

    const createGraphTemplate = (nodes, edges) => ({
        id: uuidv4(),
        name: "New template " + Math.random().toString(36).slice(-6),
        nodes,
        edges,
    });

    const handleAddTemplate = useMemo(
        () =>
            (nodes = selectedNodes, edges = selectedEdges) => {
                try {
                    visualScriptState.templates.set(currentTemplates => [
                        ...currentTemplates,
                        createGraphTemplate(nodes, edges),
                    ]);
                } catch (error) {
                    console.error("Error adding template:", error);
                }
            },
        [selectedNodes, selectedEdges],
    );

    const handleEditTemplate = editedTemplate => {
        try {
            visualScriptState.templates.set(currentTemplates => {
                const filterList = currentTemplates.filter(
                    template => template.id !== editedTemplate.id,
                );
                return [...filterList, editedTemplate];
            });
        } catch (error) {
            console.error("Error editing template:", error);
        }
    };

    const handleDeleteTemplate = deleteTemplate => {
        try {
            visualScriptState.templates.set(currentTemplates =>
                currentTemplates.filter(template => template.id !== deleteTemplate.id),
            );
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const handleApplyTemplate = template => {
        try {
            console.log("DEBUG ", template.name);
            pasteNodes(template.nodes, template.edges, true, template.name);
        } catch (error) {
            console.error("Error applying template:", error);
        }
    };

    return { handleAddTemplate, handleEditTemplate, handleDeleteTemplate, handleApplyTemplate };
};
