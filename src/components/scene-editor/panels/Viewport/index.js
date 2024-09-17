import React from "react";
import { useTranslation } from "react-i18next";

import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import ViewPortPanelContainer from "./container";

export const ViewportPanelTitle = () => {
    const { t } = useTranslation();

    return (
        <PanelDragContainer>
            <PanelTitle>{t("editor:viewport.title")}</PanelTitle>
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
