import React from "react";
import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import ScenesPanel from "./container";

/**
 * Displays the scenes that exist in the current project.
 */
export const ScenePanelTitle = () => {
    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>Scene</PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export const ScenePanelTab = {
    id: "scenePanel",
    closable: true,
    cached: true,
    title: <ScenePanelTitle />,
    content: <ScenesPanel />,
};

export default ScenePanelTitle;
