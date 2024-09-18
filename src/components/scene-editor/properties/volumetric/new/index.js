import { t } from "i18next";
import React, { useEffect } from "react";
import { MdVideocam } from "react-icons/md";
import { Scrubber } from "react-scrubber";
import { hasComponent, useComponent } from "../../../../../ecs";
import { NewVolumetricComponent } from "../../../../../engine/scene/components/NewVolumetricComponent";
import { PlaylistComponent } from "../../../../../engine/scene/components/PlaylistComponent";
import { NO_PROXY, useHookstate } from "../../../../../hyperflux";
import InputGroup from "../../../../Group";
import SelectInput from "../../../../Select";
import Slider from "../../../../Slider";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { SelectionState } from "../../../services/SelectionServices";
import NodeEditor from "../../nodeEditor";
import { commitProperty, updateProperty } from "../../Util";

export const NewVolumetricNodeEditor = props => {
    const component = useComponent(props.entity, NewVolumetricComponent);

    const geometryTargets = useHookstate([]);
    const textureTargets = useHookstate({});

    useEffect(() => {
        if (!hasComponent(props.entity, PlaylistComponent)) {
            const nodes = SelectionState.getSelectedEntities();
            EditorControlFunctions.addOrRemoveComponent(nodes, PlaylistComponent, true);
        }
    }, []);

    useEffect(() => {
        if (component.geometry.targets.length > 0) {
            const targetOptions = [];
            const targets = component.geometry.targets.value;
            targets.forEach((target, index) => {
                targetOptions.push({ value: index, label: target });
            });
            geometryTargets.set(targetOptions);
        }
    }, [component.geometry.targets]);

    useEffect(() => {
        const textureInfo = component.texture.get(NO_PROXY);
        for (const [textureType, textureTypeInfo] of Object.entries(textureInfo)) {
            const targetOptions = [];
            const targets = textureTypeInfo.targets;
            targets.forEach((target, index) => {
                targetOptions.push({ value: index, label: target });
            });
            textureTargets.merge({
                [textureType]: targetOptions,
            });
        }
    }, [component.texture]);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.volumetric.name")}
            description={t("editor:properties.volumetric.description")}
            icon={<NewVolumetricNodeEditor.iconComponent />}
        >
            <InputGroup
                name="Volume"
                label={t("editor:properties.media.lbl-volume")}
                className="w-auto"
            >
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={component.volume.value}
                    onChange={updateProperty(NewVolumetricComponent, "volume")}
                    onRelease={commitProperty(NewVolumetricComponent, "volume")}
                />
            </InputGroup>

            {component.geometry.targets.length > 0 && (
                <InputGroup name="Geometry Target" label="Geometry Target">
                    <SelectInput
                        options={geometryTargets.value}
                        value={
                            component.geometry.userTarget.value === -1
                                ? component.geometry.currentTarget.value
                                : component.geometry.userTarget.value
                        }
                        onChange={value => {
                            component.geometry.userTarget.set(value);
                        }}
                    />
                </InputGroup>
            )}

            {textureTargets.value &&
                Object.keys(textureTargets.value).map(textureType => {
                    const userTarget = component.texture[textureType].value?.userTarget ?? -1;
                    const currentTarget = component.texture[textureType].value?.currentTarget ?? 0;
                    const value = userTarget === -1 ? currentTarget : userTarget;

                    return (
                        <InputGroup
                            key={props.entity}
                            name={`${textureType} targets`}
                            label={`${textureType} targets`}
                        >
                            <SelectInput
                                options={textureTargets.value[textureType]}
                                value={value}
                                onChange={value => {
                                    component.texture[textureType].merge({
                                        userTarget: value,
                                    });
                                }}
                            />
                        </InputGroup>
                    );
                })}

            <TimeScrubber entity={props.entity} />
        </NodeEditor>
    );
};

function TimeScrubber(props) {
    const component = useComponent(props.entity, NewVolumetricComponent);
    return (
        <InputGroup name="Current Time" label="Current Time">
            <Scrubber
                min={0}
                max={component.time.duration.value}
                value={component.time.currentTime.value / 1000}
                bufferPosition={component.time.bufferedUntil.value / 1000}
                tooltip={{
                    enabledOnHover: true,
                }}
            />
        </InputGroup>
    );

    return null;
}

NewVolumetricNodeEditor.iconComponent = MdVideocam;

export default NewVolumetricNodeEditor;
