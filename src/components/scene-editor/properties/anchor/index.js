import React from "react";
import { useTranslation } from "react-i18next";

import { MdAnchor } from "react-icons/md";
import { useComponent } from "../../../../ecs/ComponentFunctions";
import { PersistentAnchorComponent } from "../../../../spatial/xr/XRAnchorComponents";
import InputGroup from "../../../Group";
import StringInput from "../../../inputs/String";
import NodeEditor from "../nodeEditor";
import { commitProperty, updateProperty } from "../Util";

export const PersistentAnchorNodeEditor = props => {
    const { t } = useTranslation();

    const anchor = useComponent(props.entity, PersistentAnchorComponent);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.persistent-anchor.name")}
            description={t("editor:properties.persistent-anchor.description")}
            icon={<PersistentAnchorNodeEditor.iconComponent />}
        >
            <InputGroup name="Volume" label={t("editor:properties.persistent-anchor.lbl-name")}>
                <StringInput
                    value={anchor.name.value}
                    onChange={updateProperty(PersistentAnchorComponent, "name")}
                    onRelease={commitProperty(PersistentAnchorComponent, "name")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

PersistentAnchorNodeEditor.iconComponent = MdAnchor;

export default PersistentAnchorNodeEditor;
