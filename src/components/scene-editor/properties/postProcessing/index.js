import { BlendFunction, SMAAPreset, VignetteTechnique } from "postprocessing";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdAutoFixHigh } from "react-icons/md";
import {
    Color,
    DisplayP3ColorSpace,
    LinearDisplayP3ColorSpace,
    LinearSRGBColorSpace,
    SRGBColorSpace,
} from "three";

import { GiMagickTrick } from "react-icons/gi";
import { useComponent } from "../../../../ecs/ComponentFunctions";
import { NO_PROXY, getState } from "../../../../hyperflux";
import { PostProcessingComponent } from "../../../../spatial/renderer/components/PostProcessingComponent";
import { PostProcessingEffectState } from "../../../../spatial/renderer/effects/EffectRegistry";
import Accordion from "../../../Accordion";
import BooleanInput from "../../../Boolean";
import Checkbox from "../../../Checkbox";
import ColorInput from "../../../Color";
import InputGroup from "../../../Group";
import TexturePreviewInput from "../../../inputs/Texture";
import Vector2Input from "../../../inputs/Vector2";
import Vector3Input from "../../../inputs/Vector3";
import SelectInput from "../../../Select";
import Slider from "../../../Slider";
import NodeEditor from "../nodeEditor";
import { commitProperties, commitProperty, updateProperty } from "../Util";

const PropertyTypes = {
    BlendFunction: "BlendFunction",
    Number: "Number",
    Boolean: "Boolean",
    Color: "Color",
    ColorSpace: "ColorSpace",
    KernelSize: "KernelSize",
    SMAAPreset: "SMAAPreset",
    EdgeDetectionMode: "EdgeDetectionMode",
    PredicationMode: "PredicationMode",
    Texture: "Texture",
    Vector2: "Vector2",
    Vector3: "Vector3",
    VignetteTechnique: "VignetteTechnique",
};

const SMAAPresetSelect = Object.entries(SMAAPreset).map(([label, value]) => {
    return { label, value };
});

const BlendFunctionSelect = Object.entries(BlendFunction).map(([label, value]) => {
    return { label, value };
});

const VignetteTechniqueSelect = Object.entries(VignetteTechnique).map(([label, value]) => {
    return { label, value };
});

const ColorSpaceSelect = [
    { label: "NONE", value: "" },
    { label: "SRGB", value: SRGBColorSpace },
    { label: "SRGB LINEAR", value: LinearSRGBColorSpace },
    { label: "DISPLAY P3", value: DisplayP3ColorSpace },
    { label: "DISPLAY P3 LINEAR", value: LinearDisplayP3ColorSpace },
];

const KernelSizeSelect = [
    { label: "VERY_SMALL", value: 0 },
    { label: "SMALL", value: 1 },
    { label: "MEDIUM", value: 2 },
    { label: "LARGE", value: 3 },
    { label: "VERY_LARGE", value: 4 },
    { label: "HUGE", value: 5 },
];

const EdgeDetectionMode = [
    { label: "DEPTH", value: 0 },
    { label: "LUMA", value: 1 },
    { label: "COLOR", value: 2 },
];

const PredicationMode = [
    { label: "DISABLED", value: 0 },
    { label: "DEPTH", value: 1 },
    { label: "CUSTOM", value: 2 },
];
export const PostProcessingSettingsEditor = props => {
    const { t } = useTranslation();

    const [openSettings, setOpenSettings] = useState(false);
    const effects = getState(PostProcessingEffectState);
    const postprocessing = useComponent(props.entity, PostProcessingComponent);

    const renderProperty = (effectName, property, index) => {
        const effectSettingState = effects[effectName].schema[property];
        const effectSettingValue = postprocessing.effects[effectName][property].get(NO_PROXY);

        let renderVal = <></>;

        switch (effectSettingState.propertyType) {
            case PropertyTypes.Number:
                renderVal = (
                    <Slider
                        min={effectSettingState.min}
                        max={effectSettingState.max}
                        step={effectSettingState.step}
                        value={effectSettingValue}
                        onChange={updateProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        onRelease={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                    />
                );
                break;

            case PropertyTypes.Boolean:
                renderVal = (
                    <BooleanInput
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;
            case PropertyTypes.SMAAPreset:
                renderVal = (
                    <SelectInput
                        options={SMAAPresetSelect}
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;
            case PropertyTypes.BlendFunction:
                renderVal = (
                    <SelectInput
                        options={BlendFunctionSelect}
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;

            case PropertyTypes.VignetteTechnique:
                renderVal = (
                    <SelectInput
                        options={VignetteTechniqueSelect}
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;

            case PropertyTypes.Vector2:
                renderVal = (
                    <Vector2Input
                        value={effectSettingValue}
                        onChange={updateProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        onRelease={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                    />
                );
                break;

            case PropertyTypes.Vector3:
                renderVal = (
                    <Vector3Input
                        value={effectSettingValue}
                        onChange={updateProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        onRelease={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                    />
                );
                break;

            case PropertyTypes.Texture:
                renderVal = (
                    <TexturePreviewInput
                        value={effectSettingValue}
                        onRelease={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                    />
                );
                break;
            case PropertyTypes.Color:
                renderVal = (
                    <ColorInput
                        value={new Color(effectSettingValue)}
                        onChange={value =>
                            updateProperty(
                                PostProcessingComponent,
                                `effects.${effectName}.${property}`,
                            )("#" + value)
                        }
                        onRelease={value =>
                            commitProperty(
                                PostProcessingComponent,
                                `effects.${effectName}.${property}`,
                            )("#" + value)
                        }
                    />
                );
                break;

            case PropertyTypes.KernelSize:
                renderVal = (
                    <SelectInput
                        options={KernelSizeSelect}
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;
            case PropertyTypes.EdgeDetectionMode:
                renderVal = (
                    <SelectInput
                        options={EdgeDetectionMode}
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;

            case PropertyTypes.PredicationMode:
                renderVal = (
                    <SelectInput
                        options={PredicationMode}
                        onChange={commitProperty(
                            PostProcessingComponent,
                            `effects.${effectName}.${property}`,
                        )}
                        value={effectSettingValue}
                    />
                );
                break;
            default:
                renderVal = <>Can't Determine type of property</>;
        }

        return (
            <div key={index}>
                <InputGroup name={effectSettingState.name} label={effectSettingState.name}>
                    {renderVal}
                </InputGroup>
            </div>
        );
    };

    const renderEffectsTypes = effectName => {
        const effect = getState(PostProcessingEffectState)[effectName].schema;
        return Object.keys(effect).map((prop, index) => renderProperty(effectName, prop, index));
    };

    const renderEffects = () => {
        const items = Object.keys(getState(PostProcessingEffectState)).map(effect => {
            return (
                <div className="py-1" key={effect}>
                    <Checkbox
                        onChange={val =>
                            commitProperties(
                                PostProcessingComponent,
                                { [`effects.${effect}.isActive`]: val },
                                [props.entity],
                            )
                        }
                        value={postprocessing.effects[effect]?.isActive?.value}
                        label={effect}
                    />
                    {postprocessing.effects[effect]?.isActive?.value && (
                        <div>
                            {renderEffectsTypes(effect)}
                            <hr className="my-2 h-[1px] text-[#A0A1A2]" />
                        </div>
                    )}
                </div>
            );
        });
        return <div>{items}</div>;
    };

    return (
        <NodeEditor
            name={t("editor:properties.postprocessing.name")}
            description={t("editor:properties.postprocessing.description")}
            icon={<PostProcessingSettingsEditor.iconComponent />}
            {...props}
        >
            <InputGroup
                name="Post Processing Enabled"
                label={t("editor:properties.postprocessing.enabled")}
            >
                <BooleanInput
                    value={postprocessing.enabled.value}
                    onChange={val => {
                        console.log("changed ", val, !!val);
                        commitProperty(PostProcessingComponent, "enabled")(val);
                    }}
                />
            </InputGroup>
            {postprocessing.enabled.value && (
                <>
                    <Accordion
                        className="bg-none p-2 text-white"
                        onClick={() => setOpenSettings(!openSettings)}
                        title={t("editor:properties.postprocessing.name")}
                        prefixIcon={<GiMagickTrick />}
                        expandIcon={<FaChevronDown />}
                        shrinkIcon={<FaChevronUp />}
                    >
                        {renderEffects()}
                    </Accordion>
                </>
            )}
        </NodeEditor>
    );
};

PostProcessingSettingsEditor.iconComponent = MdAutoFixHigh;

export default PostProcessingSettingsEditor;
