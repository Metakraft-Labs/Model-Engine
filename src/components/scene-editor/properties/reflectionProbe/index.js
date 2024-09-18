import React from "react";
import { useTranslation } from "react-i18next";

import { useComponent } from "../../../../ecs/ComponentFunctions";
import { getEntityErrors } from "../../../../engine/scene/components/ErrorComponent";
import { ReflectionProbeComponent } from "../../../../engine/scene/components/ReflectionProbeComponent";

import { IoMapOutline } from "react-icons/io5";
import InputGroup from "../../../Group";
import ImagePreviewInput from "../../../inputs/Image/Preview";
import NodeEditor from "../nodeEditor";
import { commitProperty } from "../Util";

/**
 * ReflectionProbeEditor provides the editor view for reflection probe property customization.
 */
export const ReflectionProbeEditor = props => {
    const { t } = useTranslation();
    const entity = props.entity;

    const reflectionProbeComponent = useComponent(entity, ReflectionProbeComponent);

    const errors = getEntityErrors(props.entity, ReflectionProbeComponent);

    return (
        <NodeEditor
            {...props}
            component={ReflectionProbeComponent}
            name={t("editor:properties.reflectionProbe.name")}
            description={t("editor:properties.reflectionProbe.description")}
            icon={<ReflectionProbeEditor.iconComponent />}
        >
            <div>
                <InputGroup name="Texture URL" label={t("editor:properties.reflectionProbe.src")}>
                    <ImagePreviewInput
                        value={reflectionProbeComponent.src.value}
                        onRelease={commitProperty(ReflectionProbeComponent, "src")}
                    />
                    {errors?.LOADING_ERROR && (
                        <div style={{ marginTop: 2, color: "#FF8C00" }}>
                            {t("editor:properties.scene.error-url")}
                        </div>
                    )}
                </InputGroup>
            </div>
        </NodeEditor>
    );
};
ReflectionProbeEditor.iconComponent = IoMapOutline;
export default ReflectionProbeEditor;
