import React from "react";
import { useTranslation } from "react-i18next";
import { LuPlayCircle } from "react-icons/lu";
import InputGroup from "../../../Group";
import NumericInput from "../../../inputs/Numeric";
import NodeEditor from "../nodeEditor";

/**
 * SpawnPointNodeEditor component used to provide the editor view to customize Spawn Point properties.
 *
 * @type {Class component}
 */
export const XRUIPlaybackNodeEditor = props => {
    const { t } = useTranslation();

    //const spawnComponent = useComponent(props.entity, SpawnPointComponent)

    return (
        <NodeEditor
            name={t("editor:properties.xruiPlayback.name")}
            description={t("editor:properties.xruiPlayback.description")}
            icon={<XRUIPlaybackNodeEditor.iconComponent />}
            {...props}
        >
            <InputGroup
                name="Playback Width"
                label={t("editor:properties.xruiPlayback.lbl-playback-width")}
                info={t("editor:properties.xruiPlayback.lbl-playback-width")}
            >
                <NumericInput
                    min={0}
                    mediumStep={1}
                    value={
                        //lightComponent.intensity
                        0
                    }
                    onChange={() => {}}
                    //onChange={updateProperty(, '')}
                    //onRelease={commitProperty(, '')}
                    unit="px"
                />
            </InputGroup>
        </NodeEditor>
    );
};

XRUIPlaybackNodeEditor.iconComponent = LuPlayCircle;

export default XRUIPlaybackNodeEditor;
