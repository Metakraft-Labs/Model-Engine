import React from "react";
import { useTranslation } from "react-i18next";

import { useComponent } from "../../../../ecs/ComponentFunctions";

import { FaRegFaceFlushed } from "react-icons/fa6";

import { LookAtComponent } from "../../../../spatial/transform/components/LookAtComponent";
import BooleanInput from "../../../Boolean";
import InputGroup from "../../../Group";
import NodeInput from "../../../inputs/Node";
import NodeEditor from "../nodeEditor";
import { commitProperty } from "../Util";

/**
 * FacerNodeEditor component used to customize the facer element on the scene
 */
export const LookAtNodeEditor = props => {
    const { t } = useTranslation();

    const lookAtComponent = useComponent(props.entity, LookAtComponent);

    return (
        <NodeEditor
            entity={props.entity}
            component={LookAtComponent}
            name={t("editor:properties.facer.name")}
            description={t("editor:properties.facer.description")}
            icon={<LookAtNodeEditor.iconComponent />}
        >
            <InputGroup name="Target" label={t("editor:properties.lookAt.target")}>
                <NodeInput
                    value={lookAtComponent.target.value ?? ""}
                    onRelease={commitProperty(LookAtComponent, "target")}
                    onChange={commitProperty(LookAtComponent, "target")}
                />
            </InputGroup>
            <InputGroup name="X Axis" label={t("editor:properties.lookAt.xAxis")}>
                <BooleanInput
                    value={lookAtComponent.xAxis.value}
                    onChange={commitProperty(LookAtComponent, "xAxis")}
                />
            </InputGroup>
            <InputGroup name="Y Axis" label={t("editor:properties.lookAt.yAxis")}>
                <BooleanInput
                    value={lookAtComponent.yAxis.value}
                    onChange={commitProperty(LookAtComponent, "yAxis")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

LookAtNodeEditor.iconComponent = FaRegFaceFlushed;

export default LookAtNodeEditor;
