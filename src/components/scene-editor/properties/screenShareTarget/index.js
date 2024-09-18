import { TbScreenShare } from "react-icons/tb";

import React from "react";
import { useTranslation } from "react-i18next";

import { ScreenshareTargetComponent } from "../../../../engine/scene/components/ScreenshareTargetComponent";
import NodeEditor from "../nodeEditor";

export const ScreenshareTargetNodeEditor = props => {
    const { t } = useTranslation();

    return (
        <NodeEditor
            {...props}
            component={ScreenshareTargetComponent}
            name={t("editor:properties.screenshare.name")}
            description={t("editor:properties.screenshare.description")}
            icon={<ScreenshareTargetNodeEditor.iconComponent />}
        />
    );
};

ScreenshareTargetNodeEditor.iconComponent = TbScreenShare;

export default ScreenshareTargetNodeEditor;
