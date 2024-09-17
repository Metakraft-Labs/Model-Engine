import React, { Suspense } from "react";

import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { hasComponent } from "../../../../ecs/ComponentFunctions";
import LoadingView from "../../../LoadingView";
import { EditorControlFunctions } from "../../functions/EditorControlFunctions";
import { SelectionState } from "../../services/SelectionServices";
import PropertyGroup from "../group";

class NodeEditorErrorBoundary extends React.Component {
    state = {
        error: null,
    };

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="m-2.5 overflow-auto bg-gray-600 text-red-500">
                    <Typography fontWeight="bold" component="h1">
                        [{this.props.name}] {this.state.error.message}`
                    </Typography>
                    <pre>{this.state.error.stack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export const NodeEditor = ({ description, children, name, entity, component, icon }) => {
    const { t } = useTranslation();

    return (
        <PropertyGroup
            name={name}
            description={description}
            icon={icon}
            onClose={
                component && hasComponent(entity, component)
                    ? () => {
                          const entities = SelectionState.getSelectedEntities();
                          EditorControlFunctions.addOrRemoveComponent(entities, component, false);
                      }
                    : undefined
            }
        >
            <Suspense
                fallback={
                    <LoadingView
                        fullScreen
                        className="block h-12 w-12"
                        title={t("common:loader.loadingApp", { name })}
                    />
                }
            >
                <NodeEditorErrorBoundary name={name}>{children}</NodeEditorErrorBoundary>
            </Suspense>
        </PropertyGroup>
    );
};

export default NodeEditor;
