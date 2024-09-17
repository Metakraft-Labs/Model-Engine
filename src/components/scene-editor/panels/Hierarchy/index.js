import React from "react";
import { useTranslation } from "react-i18next";
import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import HierarchyPanel from "./container";

export const HierarchyPanelTitle = () => {
    const { t } = useTranslation();

    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>{t("editor:hierarchy.lbl")}</PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export default HierarchyPanelTitle;

export const HierarchyPanelTab = {
    id: "hierarchyPanel",
    closable: true,
    title: <HierarchyPanelTitle />,
    content: <HierarchyPanel />,
};
