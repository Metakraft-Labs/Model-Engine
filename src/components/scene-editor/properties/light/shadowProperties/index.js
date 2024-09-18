import { useTranslation } from "react-i18next";

import React from "react";
import { useComponent } from "../../../../../ecs/ComponentFunctions";
import BooleanInput from "../../../../Boolean";
import InputGroup from "../../../../Group";
import NumericInput from "../../../../inputs/Numeric";
import { commitProperty, updateProperty } from "../../Util";

/**
 * OnChangeShadowMapResolution used to customize properties of LightShadowProperties
 * Used with LightNodeEditors.
 */
export const LightShadowProperties = props => {
    const { t } = useTranslation();

    const lightComponent = useComponent(props.entity, props.component);

    return (
        <>
            <InputGroup
                name="Cast Shadows"
                label={t("editor:properties.directionalLight.lbl-castShadows")}
            >
                <BooleanInput
                    value={lightComponent.castShadow.value}
                    onChange={commitProperty(props.component, "castShadow")}
                />
            </InputGroup>
            <InputGroup
                name="Shadow Bias"
                label={t("editor:properties.directionalLight.lbl-shadowBias")}
            >
                <NumericInput
                    max={0.001}
                    min={-0.001}
                    mediumStep={0.0000001}
                    smallStep={0.000001}
                    largeStep={0.0001}
                    displayPrecision={0.000001}
                    value={lightComponent.shadowBias.value}
                    onChange={updateProperty(props.component, "shadowBias")}
                    onRelease={commitProperty(props.component, "shadowBias")}
                />
            </InputGroup>
            <InputGroup
                name="Shadow Radius"
                label={t("editor:properties.directionalLight.lbl-shadowRadius")}
            >
                <NumericInput
                    mediumStep={0.01}
                    smallStep={0.1}
                    largeStep={1}
                    displayPrecision={0.0001}
                    value={lightComponent.shadowRadius.value}
                    onChange={updateProperty(props.component, "shadowRadius")}
                    onRelease={commitProperty(props.component, "shadowRadius")}
                />
            </InputGroup>
        </>
    );
};

export default LightShadowProperties;
