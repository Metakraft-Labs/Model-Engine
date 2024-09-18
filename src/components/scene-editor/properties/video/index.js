import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineVideoCamera } from "react-icons/hi2";

import { UUIDComponent } from "../../../../ecs";
import {
    getComponent,
    hasComponent,
    useComponent,
    useOptionalComponent,
} from "../../../../ecs/ComponentFunctions";
import {
    MediaComponent,
    MediaElementComponent,
} from "../../../../engine/scene/components/MediaComponent";
import { VideoComponent } from "../../../../engine/scene/components/VideoComponent";
import { NameComponent } from "../../../../spatial/common/NameComponent";

import {
    BackSide,
    ClampToEdgeWrapping,
    DoubleSide,
    FrontSide,
    MirroredRepeatWrapping,
    RepeatWrapping,
} from "three";
import { useQuery } from "../../../../ecs/QueryFunctions";
import BooleanInput from "../../../Boolean";
import InputGroup from "../../../Group";
import NumericInput from "../../../inputs/Numeric";
import Vector2Input from "../../../inputs/Vector2";
import SelectInput from "../../../Select";
import { EditorControlFunctions } from "../../functions/EditorControlFunctions";
import { SelectionState } from "../../services/SelectionServices";
import NodeEditor from "../nodeEditor";
import { commitProperty, updateProperty } from "../Util";

const fitOptions = [
    { label: "Cover", value: "cover" },
    { label: "Contain", value: "contain" },
    { label: "Vertical", value: "vertical" },
    { label: "Horizontal", value: "horizontal" },
];

const projectionOptions = [
    { label: "Flat", value: "Flat" },
    { label: "Equirectangular360", value: "Equirectangular360" },
];

const wrappingOptions = [
    { label: "Repeat", value: RepeatWrapping },
    { label: "Clamp", value: ClampToEdgeWrapping },
    { label: "Mirrored Repeat", value: MirroredRepeatWrapping },
];

/**
 * VideoNodeEditor used to render editor view for property customization.
 */
export const VideoNodeEditor = props => {
    const { t } = useTranslation();

    const video = useComponent(props.entity, VideoComponent);
    const mediaUUID = video.mediaUUID.value;
    const mediaEntity = UUIDComponent.getEntityByUUID(mediaUUID);
    const mediaElement = useOptionalComponent(mediaEntity, MediaElementComponent);
    const mediaEntities = useQuery([MediaComponent]);
    const mediaOptions = mediaEntities
        .filter(entity => entity !== props.entity)
        .map(entity => {
            return {
                label: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
            };
        });
    mediaOptions.unshift({ label: "Self", value: "" });

    useEffect(() => {
        if (!hasComponent(props.entity, MediaComponent)) {
            const nodes = SelectionState.getSelectedEntities();
            EditorControlFunctions.addOrRemoveComponent(nodes, MediaComponent, true);
        }
    }, []);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.video.name")}
            description={t("editor:properties.video.description")}
            icon={<VideoNodeEditor.iconComponent />}
        >
            {/*<ProgressBar
        value={0}
        paused={false}
        totalTime={0}
      />*/}
            <InputGroup
                name="Media"
                label={t("editor:properties.video.lbl-media")}
                info={t("editor:properties.video.lbl-media-info")}
            >
                <SelectInput
                    value={video.mediaUUID.value}
                    onChange={commitProperty(VideoComponent, "mediaUUID")}
                    options={mediaOptions}
                />
            </InputGroup>

            <InputGroup
                name="Video Size"
                label={t("editor:properties.video.lbl-size")}
                info={t("editor:properties.video.lbl-size-info")}
            >
                <Vector2Input
                    value={video.size.value}
                    onChange={updateProperty(VideoComponent, "size")}
                    onRelease={commitProperty(VideoComponent, "size")}
                />
            </InputGroup>

            <InputGroup
                name="Side"
                label={t("editor:properties.video.lbl-side")}
                info={t("editor:properties.video.lbl-side-info")}
            >
                <SelectInput
                    value={video.side.value}
                    onChange={commitProperty(VideoComponent, "side")}
                    options={[
                        { label: "Front", value: FrontSide },
                        { label: "Back", value: BackSide },
                        { label: "Double", value: DoubleSide },
                    ]}
                />
            </InputGroup>

            <InputGroup
                name="UV Offset"
                label={t("editor:properties.video.lbl-uv-offset")}
                info={t("editor:properties.video.lbl-uv-offset-info")}
            >
                <Vector2Input
                    value={video.uvOffset.value}
                    onChange={updateProperty(VideoComponent, "uvOffset")}
                    onRelease={commitProperty(VideoComponent, "uvOffset")}
                />
            </InputGroup>

            <InputGroup
                name="UV Scale"
                label={t("editor:properties.video.lbl-uv-scale")}
                info={t("editor:properties.video.lbl-uv-scale-info")}
            >
                <Vector2Input
                    value={video.uvScale.value}
                    onChange={updateProperty(VideoComponent, "uvScale")}
                    onRelease={commitProperty(VideoComponent, "uvScale")}
                />
            </InputGroup>

            <InputGroup
                name="Wrap S"
                label={t("editor:properties.video.lbl-wrap-s")}
                info={t("editor:properties.video.lbl-wrap-s-info")}
            >
                <SelectInput
                    value={video.wrapS.value}
                    onChange={commitProperty(VideoComponent, "wrapS")}
                    options={wrappingOptions}
                />
            </InputGroup>

            <InputGroup
                name="Wrap T"
                label={t("editor:properties.video.lbl-wrap-t")}
                info={t("editor:properties.video.lbl-wrap-t-info")}
            >
                <SelectInput
                    value={video.wrapT.value}
                    onChange={commitProperty(VideoComponent, "wrapT")}
                    options={wrappingOptions}
                />
            </InputGroup>

            <InputGroup
                name="Use Alpha"
                label={t("editor:properties.video.lbl-use-alpha")}
                info={t("editor:properties.video.lbl-use-alpha-info")}
            >
                <BooleanInput
                    value={video.useAlpha.value}
                    onChange={commitProperty(VideoComponent, "useAlpha")}
                />
            </InputGroup>

            {video.useAlpha.value && (
                <>
                    <InputGroup
                        name="Alpha Threshold"
                        label={t("editor:properties.video.lbl-alpha-threshold")}
                        info={t("editor:properties.video.lbl-alpha-threshold-info")}
                    >
                        <NumericInput
                            value={video.alphaThreshold.value}
                            onChange={updateProperty(VideoComponent, "alphaThreshold")}
                            onRelease={commitProperty(VideoComponent, "alphaThreshold")}
                        />
                    </InputGroup>

                    <InputGroup
                        name="Use Alpha UV Transform"
                        label={t("editor:properties.video.lbl-use-alpha-uv-transform")}
                        info={t("editor:properties.video.lbl-use-alpha-uv-transform-info")}
                    >
                        <BooleanInput
                            value={video.useAlphaUVTransform.value}
                            onChange={commitProperty(VideoComponent, "useAlphaUVTransform")}
                        />
                    </InputGroup>

                    {video.useAlphaUVTransform.value && (
                        <>
                            <InputGroup
                                name="Alpha UV Offset"
                                label={t("editor:properties.video.lbl-alpha-uv-offset")}
                                info={t("editor:properties.video.lbl-alpha-uv-offset-info")}
                            >
                                <Vector2Input
                                    value={video.alphaUVOffset.value}
                                    onChange={updateProperty(VideoComponent, "alphaUVOffset")}
                                    onRelease={commitProperty(VideoComponent, "alphaUVOffset")}
                                />
                            </InputGroup>

                            <InputGroup
                                name="Alpha UV Scale"
                                label={t("editor:properties.video.lbl-alpha-uv-scale")}
                                info={t("editor:properties.video.lbl-alpha-uv-scale-info")}
                            >
                                <Vector2Input
                                    value={video.alphaUVScale.value}
                                    onChange={updateProperty(VideoComponent, "alphaUVScale")}
                                    onRelease={commitProperty(VideoComponent, "alphaUVScale")}
                                />
                            </InputGroup>
                        </>
                    )}
                </>
            )}

            <InputGroup name="Projection" label={t("editor:properties.video.lbl-projection")}>
                <SelectInput
                    value={video.projection.value}
                    onChange={commitProperty(VideoComponent, "projection")}
                    options={projectionOptions}
                />
            </InputGroup>

            <InputGroup
                name="Video Fit"
                label={t("editor:properties.video.lbl-fit")}
                info={t("editor:properties.video.lbl-fit-info")}
            >
                <SelectInput
                    value={video.fit.value}
                    onChange={commitProperty(VideoComponent, "fit")}
                    options={fitOptions}
                />
            </InputGroup>
        </NodeEditor>
    );
};

VideoNodeEditor.iconComponent = HiOutlineVideoCamera;

export default VideoNodeEditor;
