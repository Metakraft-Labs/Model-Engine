import React from "react";

import { PanelDragContainer, PanelTitle } from "../../layout/Panel";
import FilesPanelContainer from "./container";

export const FilesPanelTitle = () => {
    return (
        <div>
            <PanelDragContainer>
                <PanelTitle>
                    <span>{"Files"}</span>
                </PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export default FilesPanelTitle;

export const FilesPanelTab = {
    id: "filesPanel",
    closable: true,
    title: <FilesPanelTitle />,
    content: <FilesPanelContainer />,
};
