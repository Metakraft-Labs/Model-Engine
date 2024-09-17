import React from "react";
import { useTranslation } from "react-i18next";
import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import ScenesPanel from "./container";

/**
 * Displays the scenes that exist in the current project.
 */
export const ScenePanelTitle = () => {
    const { t } = useTranslation();

    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>{t("editor:properties.scene.name")}</PanelTitle>
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
