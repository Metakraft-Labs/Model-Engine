import React from "react";

import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import MaterialLibraryPanel from "./container";

export const MaterialsPanelTitle = () => {
    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>
                    <span>{"Materials"}</span>
                </PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export default MaterialsPanelTitle;

export const MaterialsPanelTab = {
    id: "materialsPanel",
    closable: true,
    title: <MaterialsPanelTitle />,
    content: <MaterialLibraryPanel />,
};
