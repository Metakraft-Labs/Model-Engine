import React from "react";
import { useTranslation } from "react-i18next";

import { SiAudiomack } from "react-icons/si";
import { useComponent } from "../../../../../ecs";
import { AudioAnalysisComponent } from "../../../../../engine/scene/components/AudioAnalysisComponent";
import BooleanInput from "../../../../Boolean";
import InputGroup from "../../../../Group";
import Slider from "../../../../Slider";
import NodeEditor from "../../nodeEditor";
import { commitProperty, updateProperty } from "../../Util";

export const AudioAnalysisEditor = props => {
    const { t } = useTranslation();
    const audioAnalysisComponent = useComponent(props.entity, AudioAnalysisComponent);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.audioAnalysis.name")}
            icon={<AudioAnalysisEditor.iconComponent />}
        >
            <InputGroup name="Bass" label={t("editor:properties.audioAnalysis.lbl-bassEnabled")}>
                <BooleanInput
                    value={audioAnalysisComponent.bassEnabled.value}
                    onChange={commitProperty(AudioAnalysisComponent, "bassEnabled")}
                />
            </InputGroup>
            <InputGroup
                name="Bass Multiplier"
                label={t("editor:properties.audioAnalysis.lbl-bassMultiplier")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={5}
                    step={0.01}
                    value={audioAnalysisComponent.bassMultiplier.value}
                    onChange={updateProperty(AudioAnalysisComponent, "bassMultiplier")}
                    onRelease={commitProperty(AudioAnalysisComponent, "bassMultiplier")}
                />
            </InputGroup>
            <InputGroup
                name="Mid Enabled"
                label={t("editor:properties.audioAnalysis.lbl-midEnabled")}
            >
                <BooleanInput
                    value={audioAnalysisComponent.midEnabled.value}
                    onChange={commitProperty(AudioAnalysisComponent, "midEnabled")}
                />
            </InputGroup>
            <InputGroup
                name="Mid Multiplier"
                label={t("editor:properties.audioAnalysis.lbl-midMultiplier")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={5}
                    step={0.01}
                    value={audioAnalysisComponent.midMultiplier.value}
                    onChange={updateProperty(AudioAnalysisComponent, "midMultiplier")}
                    onRelease={commitProperty(AudioAnalysisComponent, "midMultiplier")}
                />
            </InputGroup>
            <InputGroup
                name="Treble Enabled"
                label={t("editor:properties.audioAnalysis.lbl-trebleEnabled")}
            >
                <BooleanInput
                    value={audioAnalysisComponent.trebleEnabled.value}
                    onChange={commitProperty(AudioAnalysisComponent, "trebleEnabled")}
                />
            </InputGroup>
            <InputGroup
                name="Treble Multiplier"
                label={t("editor:properties.audioAnalysis.lbl-trebleMultiplier")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={5}
                    step={0.01}
                    value={audioAnalysisComponent.trebleMultiplier.value}
                    onChange={updateProperty(AudioAnalysisComponent, "trebleMultiplier")}
                    onRelease={commitProperty(AudioAnalysisComponent, "trebleMultiplier")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

AudioAnalysisEditor.iconComponent = SiAudiomack;

export default AudioAnalysisEditor;
