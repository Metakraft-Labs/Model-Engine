import { Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import PropertiesPanelContainer from "./container";

export const PropertiesPanelTitle = () => {
    const { t } = useTranslation();

    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>
                    <Tooltip title={t("editor:properties.info")}>
                        {t("editor:properties.title")}
                    </Tooltip>
                </PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export const PropertiesPanelTab = {
    id: "propertiesPanel",
    closable: true,
    cached: true,
    title: <PropertiesPanelTitle />,
    content: <PropertiesPanelContainer />,
};

export default PropertiesPanelTitle;
