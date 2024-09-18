import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { LuUsers2 } from "react-icons/lu";
import { getComponent, hasComponent, useComponent, UUIDComponent } from "../../../../ecs";
import { InteractableComponent } from "../../../../engine/interaction/components/InteractableComponent";
import {
    MountPoint,
    MountPointComponent,
} from "../../../../engine/scene/components/MountPointComponent";
import { NO_PROXY } from "../../../../hyperflux";
import InputGroup from "../../../Group";
import Vector3Input from "../../../inputs/Vector3";
import SelectInput from "../../../Select";
import { EditorControlFunctions } from "../../functions/EditorControlFunctions";
import NodeEditor from "../nodeEditor";
import { commitProperty, updateProperty } from "../Util";

/**
 * MountPointNodeEditor component used to provide the editor view to customize Mount Point properties.
 *
 * @type {Class component}
 */
export const MountPointNodeEditor = props => {
    const { t } = useTranslation();

    const mountComponent = useComponent(props.entity, MountPointComponent);
    // const onChangeOffset = (value) => {
    //   getMutableComponent(props.entity, MountPointComponent).dismountOffset.set(value)
    // }
    useEffect(() => {
        if (!hasComponent(props.entity, InteractableComponent)) {
            const mountPoint = getComponent(props.entity, MountPointComponent);
            EditorControlFunctions.addOrRemoveComponent(
                [props.entity],
                InteractableComponent,
                true,
                {
                    label: MountPointComponent.mountPointInteractMessages[mountPoint.type],
                    callbacks: [
                        {
                            callbackID: MountPointComponent.mountCallbackName,
                            target: getComponent(props.entity, UUIDComponent),
                        },
                    ],
                },
            );
        }
    }, []);
    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.mountPoint.name")}
            description={t("editor:properties.mountPoint.description")}
            icon={<MountPointNodeEditor.iconComponent />}
        >
            <InputGroup name="Mount Type" label={t("editor:properties.mountPoint.lbl-type")}>
                <SelectInput // we dont know the options and the component for this
                    key={props.entity}
                    value={mountComponent.type.value}
                    options={Object.entries(MountPoint).map(([key, value]) => ({
                        label: key,
                        value,
                    }))}
                    onChange={commitProperty(MountPointComponent, "type")}
                />
            </InputGroup>
            <InputGroup
                name="Dismount Offset"
                label={t("editor:properties.mountPoint.lbl-dismount")}
            >
                <Vector3Input
                    value={mountComponent.dismountOffset.get(NO_PROXY)}
                    onChange={updateProperty(MountPointComponent, "dismountOffset")}
                    onRelease={commitProperty(MountPointComponent, "dismountOffset")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

MountPointNodeEditor.iconComponent = LuUsers2;

export default MountPointNodeEditor;
