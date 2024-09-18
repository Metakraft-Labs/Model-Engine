import React from "react";
import { useTranslation } from "react-i18next";
import { FaClone } from "react-icons/fa6";

import { useComponent } from "../../../../ecs/ComponentFunctions";
import { ShadowComponent } from "../../../../engine/scene/components/ShadowComponent";

import { BooleanInput } from "../../../Boolean";
import InputGroup from "../../../Group";
import NodeEditor from "../nodeEditor";
import { commitProperty } from "../Util";

/**
 * ShadowProperties used to create editor view for the properties of ModelNode.
 */
export const ShadowNodeEditor = props => {
    const { t } = useTranslation();
    const shadowComponent = useComponent(props.entity, ShadowComponent);
    return (
        <NodeEditor
            name={t("editor:properties.shadow.name")}
            component={ShadowComponent}
            description={t("editor:properties.shadow.description")}
            icon={<ShadowNodeEditor.iconComponent />}
            {...props}
        >
            <InputGroup name="Cast Shadow" label={t("editor:properties.shadow.lbl-castShadow")}>
                <BooleanInput
                    value={shadowComponent.cast.value}
                    onChange={commitProperty(ShadowComponent, "cast")}
                />
            </InputGroup>
            <InputGroup
                name="Receive Shadow"
                label={t("editor:properties.shadow.lbl-receiveShadow")}
            >
                <BooleanInput
                    value={shadowComponent.receive.value}
                    onChange={commitProperty(ShadowComponent, "receive")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

ShadowNodeEditor.iconComponent = FaClone;
export default ShadowNodeEditor;
