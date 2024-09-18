import React from "react";
import { useTranslation } from "react-i18next";
import { FiCloud } from "react-icons/fi";

import { useComponent } from "../../../../ecs/ComponentFunctions";
import { getEntityErrors } from "../../../../engine/scene/components/ErrorComponent";
import { SkyboxComponent } from "../../../../engine/scene/components/SkyboxComponent";
import { SkyTypeEnum } from "../../../../engine/scene/constants/SkyTypeEnum";

import ColorInput from "../../../Color";
import InputGroup from "../../../Group";
import FolderInput from "../../../inputs/Folder";
import ImageInput from "../../../inputs/Image";
import NumericInput from "../../../inputs/Numeric";
import SelectInput from "../../../Select";
import Slider from "../../../Slider";
import NodeEditor from "../nodeEditor";
import { commitProperties, commitProperty, updateProperty } from "../Util";

const hoursToRadians = hours => hours / 24;
const radiansToHours = rads => rads * 24;

const SkyOptions = [
    {
        label: "Color",
        value: SkyTypeEnum.color.toString(),
    },
    {
        label: "Skybox",
        value: SkyTypeEnum.skybox.toString(),
    },
    {
        label: "Cubemap",
        value: SkyTypeEnum.cubemap.toString(),
    },
    {
        label: "Equirectangular",
        value: SkyTypeEnum.equirectangular.toString(),
    },
];

/**
 * SkyboxNodeEditor component class used to render editor view to customize component property.
 */
export const SkyboxNodeEditor = props => {
    const { t } = useTranslation();
    const entity = props.entity;
    const hasError = getEntityErrors(entity, SkyboxComponent);
    const skyboxComponent = useComponent(entity, SkyboxComponent);

    const onChangeEquirectangularPathOption = equirectangularPath => {
        if (equirectangularPath !== skyboxComponent.equirectangularPath.value) {
            commitProperties(SkyboxComponent, { equirectangularPath });
        }
    };

    const onChangeCubemapPathOption = path => {
        const directory = path[path.length - 1] === "/" ? path.substring(0, path.length - 1) : path;
        if (directory !== skyboxComponent.cubemapPath.value) {
            commitProperties(SkyboxComponent, { cubemapPath: directory });
        }
    };

    const renderSkyboxSettings = () => (
        <>
            <InputGroup name="Time of Day" label={t("editor:properties.skybox.lbl-timeOfDay")}>
                <NumericInput
                    smallStep={0.1}
                    mediumStep={0.5}
                    largeStep={1}
                    min={0}
                    max={24}
                    value={radiansToHours(skyboxComponent.skyboxProps.azimuth.value)}
                    onChange={value =>
                        updateProperty(
                            SkyboxComponent,
                            "skyboxProps.azimuth",
                        )(hoursToRadians(value))
                    }
                    onRelease={value =>
                        commitProperty(
                            SkyboxComponent,
                            "skyboxProps.azimuth",
                        )(hoursToRadians(value))
                    }
                    unit="h"
                />
            </InputGroup>
            <InputGroup name="Latitude" label={t("editor:properties.skybox.lbl-latitude")}>
                <NumericInput
                    min={-90}
                    max={90}
                    smallStep={0.1}
                    mediumStep={0.5}
                    largeStep={1}
                    value={skyboxComponent.skyboxProps.inclination.value}
                    onChange={updateProperty(SkyboxComponent, "skyboxProps.inclination")}
                    onRelease={commitProperty(SkyboxComponent, "skyboxProps.inclination")}
                />
            </InputGroup>
            <InputGroup
                name="Luminance"
                label={t("editor:properties.skybox.lbl-luminance")}
                className="w-auto"
            >
                <Slider
                    min={0.001}
                    max={1}
                    step={0.001}
                    value={skyboxComponent.skyboxProps.luminance.value}
                    onChange={updateProperty(SkyboxComponent, "skyboxProps.luminance")}
                    onRelease={commitProperty(SkyboxComponent, "skyboxProps.luminance")}
                />
            </InputGroup>
            <InputGroup
                name="Scattering Amount"
                label={t("editor:properties.skybox.lbl-scattering")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={0.1}
                    step={0.001}
                    value={skyboxComponent.skyboxProps.mieCoefficient.value}
                    onChange={updateProperty(SkyboxComponent, "skyboxProps.mieCoefficient")}
                    onRelease={commitProperty(SkyboxComponent, "skyboxProps.mieCoefficient")}
                />
            </InputGroup>
            <InputGroup
                name="Scattering Distance"
                label={t("editor:properties.skybox.lbl-scatteringDistance")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={1}
                    step={0.001}
                    value={skyboxComponent.skyboxProps.mieDirectionalG.value}
                    onChange={updateProperty(SkyboxComponent, "skyboxProps.mieDirectionalG")}
                    onRelease={commitProperty(SkyboxComponent, "skyboxProps.mieDirectionalG")}
                />
            </InputGroup>
            <InputGroup
                name="Horizon Start"
                label={t("editor:properties.skybox.lbl-horizonStart")}
                className="w-auto"
            >
                <Slider
                    min={1}
                    max={20}
                    value={skyboxComponent.skyboxProps.turbidity.value}
                    onChange={updateProperty(SkyboxComponent, "skyboxProps.turbidity")}
                    onRelease={commitProperty(SkyboxComponent, "skyboxProps.turbidity")}
                />
            </InputGroup>
            <InputGroup
                name="Horizon End"
                label={t("editor:properties.skybox.lbl-horizonEnd")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={4}
                    value={skyboxComponent.skyboxProps.rayleigh.value}
                    onChange={updateProperty(SkyboxComponent, "skyboxProps.rayleigh")}
                    onRelease={commitProperty(SkyboxComponent, "skyboxProps.rayleigh")}
                />
            </InputGroup>
        </>
    );

    // creating editor view for equirectangular Settings
    const renderEquirectangularSettings = () => (
        <InputGroup name="Texture" label={t("editor:properties.skybox.lbl-texture")}>
            <ImageInput
                value={skyboxComponent.equirectangularPath.value}
                onRelease={onChangeEquirectangularPathOption}
            />
            {hasError && (
                <div style={{ marginTop: 2, color: "#FF8C00" }}>
                    {t("editor:properties.skybox.error-url")}
                </div>
            )}
        </InputGroup>
    );

    // creating editor view for cubemap Settings
    const renderCubemapSettings = () => (
        <InputGroup name="Texture" label={t("editor:properties.skybox.lbl-texture")}>
            <FolderInput
                value={skyboxComponent.cubemapPath.value}
                onRelease={onChangeCubemapPathOption}
            />
            {hasError && (
                <div style={{ marginTop: 2, color: "#FF8C00" }}>
                    {t("editor:properties.skybox.error-url")}
                </div>
            )}
        </InputGroup>
    );

    // creating editor view for color Settings
    const renderColorSettings = () => (
        <InputGroup name="Color" label={t("editor:properties.skybox.lbl-color")}>
            <ColorInput
                value={skyboxComponent.backgroundColor.value}
                onChange={updateProperty(SkyboxComponent, "backgroundColor")}
                onRelease={commitProperty(SkyboxComponent, "backgroundColor")}
            />
        </InputGroup>
    );

    // creating editor view for skybox Properties
    const renderSkyBoxProps = () => {
        switch (skyboxComponent.backgroundType.value) {
            case SkyTypeEnum.equirectangular:
                return renderEquirectangularSettings();
            case SkyTypeEnum.cubemap:
                return renderCubemapSettings();
            case SkyTypeEnum.color:
                return renderColorSettings();
            default:
                return renderSkyboxSettings();
        }
    };

    return (
        <NodeEditor
            name={t("editor:properties.skybox.name")}
            description={t("editor:properties.skybox.description")}
            icon={<SkyboxNodeEditor.iconComponent />}
            {...props}
        >
            <InputGroup name="Sky Type" label={t("editor:properties.skybox.lbl-skyType")}>
                <SelectInput
                    key={props.entity}
                    options={SkyOptions}
                    value={skyboxComponent.backgroundType.value.toString()}
                    onChange={value =>
                        commitProperty(SkyboxComponent, "backgroundType")(parseInt(value, 10))
                    }
                />
            </InputGroup>
            {renderSkyBoxProps()}
        </NodeEditor>
    );
};

SkyboxNodeEditor.iconComponent = FiCloud;

export default SkyboxNodeEditor;
