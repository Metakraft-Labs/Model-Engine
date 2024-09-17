import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

export const useVariableHandler = ({ variables, setVariables }) => {
    const createVariable = () => ({
        id: uuidv4(),
        name: "variable " + Math.random().toString(36).slice(-6),
        valueTypeName: "string",
        initialValue: "",
    });

    const handleAddVariable = useMemo(
        () => () => {
            try {
                setVariables(graphVariable => [...graphVariable, createVariable()]);
            } catch (error) {
                console.error("Error adding variable:", error);
            }
        },
        [variables],
    );

    const handleEditVariable = editedVariable => {
        try {
            setVariables(currentVariables => {
                const filterList = currentVariables.filter(
                    variable => variable.id !== editedVariable.id,
                );
                return [...filterList, editedVariable];
            });
        } catch (error) {
            console.error("Error editing variable:", error);
        }
    };

    const handleDeleteVariable = deleteVariable => {
        try {
            setVariables(currentVariables =>
                currentVariables.filter(variable => variable.id !== deleteVariable.id),
            );
        } catch (error) {
            console.error("Error deleting variable:", error);
        }
    };

    return { handleAddVariable, handleEditVariable, handleDeleteVariable };
};
