import React from "react";
import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import HierarchyPanel from "./container";

export const HierarchyPanelTitle = () => {
    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>Hierarchy</PanelTitle>
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
