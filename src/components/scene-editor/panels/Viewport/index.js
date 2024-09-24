import React from "react";

import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import ViewPortPanelContainer from "./container";

export const ViewportPanelTitle = () => {
    return (
        <PanelDragContainer>
            <PanelTitle>Viewport</PanelTitle>
        </PanelDragContainer>
    );
};

export default ViewportPanelTitle;

export const ViewportPanelTab = {
    id: "viewPanel",
    closable: true,
    title: <ViewportPanelTitle />,
    content: <ViewPortPanelContainer />,
};
