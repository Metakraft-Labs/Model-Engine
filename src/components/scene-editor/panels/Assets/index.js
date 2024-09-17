import React from "react";
import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import AssetsPanel from "./container";

export const AssetsPanelTitle = () => {
    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>
                    <span>{"Assets"}</span>
                </PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export default AssetsPanelTitle;

export const AssetsPanelTab = {
    id: "assetsPanel",
    closable: true,
    title: <AssetsPanelTitle />,
    content: <AssetsPanel />,
};
