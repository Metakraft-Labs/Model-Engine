import React from "react";
import { useTranslation } from "react-i18next";

import { PointLightComponent } from "../../../../../spatial/renderer/components/lights/PointLightComponent";

import { AiOutlineBulb } from "react-icons/ai";
import { useComponent } from "../../../../../ecs";
import ColorInput from "../../../../Color";
import InputGroup from "../../../../Group";
import NumericInput from "../../../../inputs/Numeric";
import NodeEditor from "../../nodeEditor";
import { commitProperty, updateProperty } from "../../Util";

export const PointLightNodeEditor = props => {
    const { t } = useTranslation();
    const lightComponent = useComponent(props.entity, PointLightComponent).value;

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.pointLight.name")}
            description={t("editor:properties.pointLight.description")}
            icon={<PointLightNodeEditor.iconComponent />}
        >
            <InputGroup name="Color" label={t("editor:properties.pointLight.lbl-color")}>
                <ColorInput
                    value={lightComponent.color}
                    onChange={updateProperty(PointLightComponent, "color")}
                    onRelease={commitProperty(PointLightComponent, "color")}
                />
            </InputGroup>
            <InputGroup name="Intensity" label={t("editor:properties.pointLight.lbl-intensity")}>
                <NumericInput
                    min={0}
                    smallStep={0.001}
                    mediumStep={0.01}
                    largeStep={0.1}
                    value={lightComponent.intensity}
                    onChange={updateProperty(PointLightComponent, "intensity")}
                    onRelease={commitProperty(PointLightComponent, "intensity")}
                    unit="cd"
                />
            </InputGroup>
            <InputGroup name="Range" label={t("editor:properties.pointLight.lbl-range")}>
                <NumericInput
                    min={0}
                    smallStep={0.1}
                    mediumStep={1}
                    largeStep={10}
                    value={lightComponent.range}
                    onChange={updateProperty(PointLightComponent, "range")}
                    onRelease={commitProperty(PointLightComponent, "range")}
                    unit="m"
                />
            </InputGroup>
            <InputGroup name="Decay" label={t("editor:properties.pointLight.lbl-decay")}>
                <NumericInput
                    min={0}
                    smallStep={0.1}
                    mediumStep={1}
                    largeStep={10}
                    value={lightComponent.decay}
                    onChange={updateProperty(PointLightComponent, "decay")}
                    onRelease={commitProperty(PointLightComponent, "decay")}
                />
            </InputGroup>
            {/* <LightShadowProperties entity={props.entity} component={PointLightComponent} /> */}
        </NodeEditor>
    );
};

PointLightNodeEditor.iconComponent = AiOutlineBulb;

export default PointLightNodeEditor;
