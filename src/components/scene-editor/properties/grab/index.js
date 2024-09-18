import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { GiGrab } from "react-icons/gi";
import { isClient } from "../../../../common/src/utils/getEnvironment";
import { getComponent, hasComponent, UUIDComponent } from "../../../../ecs";
import { GrabbableComponent } from "../../../../engine/interaction/components/GrabbableComponent";
import { InteractableComponent } from "../../../../engine/interaction/components/InteractableComponent";
import { grabbableInteractMessage } from "../../../../engine/interaction/functions/grabbableFunctions";
import { EditorControlFunctions } from "../../functions/EditorControlFunctions";
import NodeEditor from "../nodeEditor";

export const GrabbableComponentNodeEditor = props => {
    const { t } = useTranslation();

    useEffect(() => {
        if (isClient) {
            if (!hasComponent(props.entity, InteractableComponent)) {
                EditorControlFunctions.addOrRemoveComponent(
                    [props.entity],
                    InteractableComponent,
                    true,
                    {
                        label: grabbableInteractMessage,
                        callbacks: [
                            {
                                callbackID: GrabbableComponent.grabbableCallbackName,
                                target: getComponent(props.entity, UUIDComponent),
                            },
                        ],
                    },
                );
            }
        }
    }, []);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.grabbable.name")}
            description={t("editor:properties.grabbable.description")}
            icon={<GrabbableComponentNodeEditor.iconComponent />}
        >
            <div id={"grabbable-component"}></div>
        </NodeEditor>
    );
};

GrabbableComponentNodeEditor.iconComponent = GiGrab;

export default GrabbableComponentNodeEditor;
