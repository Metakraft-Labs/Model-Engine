import React from "react";
import { useTranslation } from "react-i18next";
import { MdPanTool } from "react-icons/md";

import { camelCaseToSpacedString } from "../../../../common/src/utils/camelCaseToSpacedString";
import { useComponent } from "../../../../ecs/ComponentFunctions";
import { RigidBodyComponent } from "../../../../spatial/physics/components/RigidBodyComponent";
import { BodyTypes } from "../../../../spatial/physics/types/PhysicsTypes";
import InputGroup from "../../../Group";
import SelectInput from "../../../Select";
import NodeEditor from "../nodeEditor";
import { commitProperty } from "../Util";

const bodyTypeOptions = Object.entries(BodyTypes).map(([label, value]) => {
    return { label: camelCaseToSpacedString(label), value };
});

export const RigidBodyComponentEditor = props => {
    const { t } = useTranslation();
    const rigidbodyComponent = useComponent(props.entity, RigidBodyComponent);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.rigidbody.name")}
            description={t("editor:properties.rigidbody.description")}
            icon={<RigidBodyComponentEditor.iconComponent />}
        >
            <InputGroup name="Type" label={t("editor:properties.rigidbody.lbl-type")}>
                <SelectInput
                    options={bodyTypeOptions}
                    value={rigidbodyComponent.type.value}
                    onChange={commitProperty(RigidBodyComponent, "type")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

RigidBodyComponentEditor.iconComponent = MdPanTool;

export default RigidBodyComponentEditor;
