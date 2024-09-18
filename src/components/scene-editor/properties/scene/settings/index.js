import getImagePalette from "image-palette-core";
import React from "react";
import { useTranslation } from "react-i18next";
import { Color } from "three";

import { RiLandscapeLine } from "react-icons/ri";
import { useComponent } from "../../../../../ecs/ComponentFunctions";
import {
    blurAndScaleImageData,
    convertImageDataToKTX2Blob,
    imageDataToBlob,
} from "../../../../../engine/scene/classes/ImageUtils";
import { SceneSettingsComponent } from "../../../../../engine/scene/components/SceneSettingsComponent";
import { getState, useHookstate, useState } from "../../../../../hyperflux";
import BooleanInput from "../../../../Boolean";
import Button from "../../../../Button";
import ColorInput from "../../../../Color";
import InputGroup from "../../../../Group";
import ImagePreviewInput from "../../../../inputs/Image/Preview";
import NumericInput from "../../../../inputs/Numeric";
import LoadingView from "../../../../LoadingView";
import { uploadProjectFiles } from "../../../functions/assetFunctions";
import { takeScreenshot } from "../../../functions/takeScreenshot";
import { generateEnvmapBake } from "../../../functions/uploadEnvMapBake";
import NodeInput from "../../../input/Node";
import { EditorState } from "../../../services/EditorServices";
import PropertyGroup from "../../group";
import { commitProperties, commitProperty, updateProperty } from "../Util";

// const cameraQuery = defineQuery([CameraComponent])

export const SceneSettingsEditor = props => {
    const { t } = useTranslation();
    const sceneSettingsComponent = useComponent(props.entity, SceneSettingsComponent);
    const state = useHookstate({
        thumbnailURL: null,
        thumbnail: null,
        uploadingThumbnail: false,
        loadingScreenURL: null,
        loadingScreenImageData: null,
        uploadingLoadingScreen: false,
        resolution: 2048,
    });

    const createThumbnail = async () => {
        const thumbnailBlob = await takeScreenshot(512, 320, "jpeg");
        if (!thumbnailBlob) return;
        const thumbnailURL = URL.createObjectURL(thumbnailBlob);
        const sceneName = getState(EditorState).sceneName?.split(".").slice(0, -1).join(".");
        const file = new File([thumbnailBlob], sceneName + ".thumbnail.jpg");
        state.merge({
            thumbnailURL,
            thumbnail: file,
        });
    };

    const uploadThumbnail = async () => {
        if (!state.thumbnail.value) return;
        state.uploadingThumbnail.set(true);
        const editorState = getState(EditorState);
        const projectName = editorState.projectName;
        const currentSceneDirectory = getState(EditorState)
            .scenePath?.split("/")
            .slice(0, -1)
            .join("/");
        const { promises } = uploadProjectFiles(
            projectName,
            [state.thumbnail.value],
            [currentSceneDirectory],
        );
        const [[savedThumbnailURL]] = await Promise.all(promises);
        commitProperty(SceneSettingsComponent, "thumbnailURL")(savedThumbnailURL);
        state.merge({
            thumbnailURL: null,
            thumbnail: null,
            uploadingThumbnail: false,
        });
    };

    const createLoadingScreen = async () => {
        const envmapImageData = generateEnvmapBake(state.resolution.value);
        const blob = await imageDataToBlob(envmapImageData);
        state.merge({
            loadingScreenURL: URL.createObjectURL(blob),
            loadingScreenImageData: envmapImageData,
        });
    };

    const uploadLoadingScreen = async () => {
        const envmapImageData = state.loadingScreenImageData.value;
        if (!envmapImageData) return;
        state.uploadingLoadingScreen.set(true);

        const loadingScreenImageData = blurAndScaleImageData(envmapImageData, 2048, 2048, 6, 512);

        const [envmap, loadingScreen] = await Promise.all([
            convertImageDataToKTX2Blob(envmapImageData),
            convertImageDataToKTX2Blob(loadingScreenImageData),
        ]);

        if (!envmap || !loadingScreen) return null;

        const editorState = getState(EditorState);
        const sceneName = editorState.sceneName?.split(".").slice(0, -1).join(".");
        const projectName = editorState.projectName;
        const envmapFilename = `${sceneName}.envmap.ktx2`;
        const loadingScreenFilename = `${sceneName}.loadingscreen.ktx2`;

        const currentSceneDirectory = getState(EditorState)
            .scenePath?.split("/")
            .slice(0, -1)
            .join("/");
        const promises = uploadProjectFiles(
            projectName,
            [new File([envmap], envmapFilename), new File([loadingScreen], loadingScreenFilename)],
            [currentSceneDirectory, currentSceneDirectory],
        );

        const [[envmapURL], [loadingScreenURL]] = await Promise.all(promises.promises);

        const cleanURL = new URL(loadingScreenURL);
        cleanURL.hash = "";
        cleanURL.search = "";
        commitProperty(SceneSettingsComponent, "loadingScreenURL")(cleanURL.href);
        state.merge({
            loadingScreenURL: null,
            loadingScreenImageData: null,
            uploadingLoadingScreen: false,
        });
    };

    const generateColors = () => {
        const url = state.thumbnailURL.value ?? sceneSettingsComponent.thumbnailURL.value;
        if (!url) return;
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            const palette = getImagePalette(image);
            if (palette) {
                commitProperties(SceneSettingsComponent, {
                    primaryColor: palette.color,
                    backgroundColor: palette.backgroundColor,
                    alternativeColor: palette.alternativeColor,
                });
            }
        };
        image.src = url;
    };

    const useSpectatingEntity = useState(sceneSettingsComponent.spectateEntity.value !== null);

    return (
        <PropertyGroup
            name={t("editor:properties.sceneSettings.name")}
            description={t("editor:properties.sceneSettings.description")}
            icon={<SceneSettingsEditor.iconComponent />}
        >
            <InputGroup
                name="Spectate Entity"
                label={t("editor:properties.sceneSettings.lbl-spectate")}
                info={t("editor:properties.sceneSettings.info-spectate")}
            >
                <BooleanInput
                    value={useSpectatingEntity.value}
                    onChange={value => {
                        useSpectatingEntity.set(value);
                        commitProperty(
                            SceneSettingsComponent,
                            "spectateEntity",
                        )(useSpectatingEntity.value ? "" : null);
                    }}
                />
            </InputGroup>
            {useSpectatingEntity.value ? (
                <InputGroup
                    name="Entity UUID"
                    label={t("editor:properties.sceneSettings.lbl-uuid")}
                    info={t("editor:properties.sceneSettings.info-uuid")}
                >
                    <NodeInput
                        value={sceneSettingsComponent.spectateEntity.value ?? ""}
                        onRelease={commitProperty(SceneSettingsComponent, `spectateEntity`)}
                        onChange={commitProperty(SceneSettingsComponent, `spectateEntity`)}
                    />
                </InputGroup>
            ) : (
                <></>
            )}

            <InputGroup
                name="Thumbnail"
                label={t("editor:properties.sceneSettings.lbl-thumbnail")}
                info={t("editor:properties.sceneSettings.info-thumbnail")}
                className="w-auto"
            >
                <div>
                    <ImagePreviewInput
                        value={
                            state.thumbnailURL.value ?? sceneSettingsComponent.thumbnailURL.value
                        }
                    />

                    <Button onClick={createThumbnail} className="mt-2 w-full">
                        {t("editor:properties.sceneSettings.generate")}
                    </Button>
                    {state.uploadingThumbnail.value ? (
                        <LoadingView spinnerOnly />
                    ) : (
                        <Button
                            onClick={uploadThumbnail}
                            disabled={!state.thumbnail.value}
                            className="mt-2 w-full"
                        >
                            {t("editor:properties.sceneSettings.save")}
                        </Button>
                    )}
                </div>
            </InputGroup>
            <InputGroup
                name="Loading Screen"
                label={t("editor:properties.sceneSettings.lbl-loading")}
                info={t("editor:properties.sceneSettings.info-loading")}
                className="w-auto"
            >
                <div>
                    <ImagePreviewInput
                        value={
                            state.loadingScreenURL.value ??
                            sceneSettingsComponent.loadingScreenURL.value
                        }
                    />
                    <Button onClick={createLoadingScreen} className="mt-2 w-full">
                        {t("editor:properties.sceneSettings.generate")}
                    </Button>
                    {state.uploadingLoadingScreen.value ? (
                        <LoadingView spinnerOnly />
                    ) : (
                        <Button
                            onClick={uploadLoadingScreen}
                            disabled={!state.loadingScreenImageData.value}
                            className="mt-2 w-full"
                        >
                            {t("editor:properties.sceneSettings.save")}
                        </Button>
                    )}
                </div>
            </InputGroup>
            <InputGroup
                name="Primary Color"
                label={t("editor:properties.sceneSettings.lbl-colors")}
            >
                <div className="w-full space-y-2">
                    <ColorInput
                        disabled={
                            !state.thumbnailURL.value && !sceneSettingsComponent.thumbnailURL.value
                        }
                        value={new Color(sceneSettingsComponent.primaryColor.value)}
                        onChange={val =>
                            updateProperty(
                                SceneSettingsComponent,
                                "primaryColor",
                            )("#" + val.getHexString())
                        }
                        onRelease={val =>
                            commitProperty(
                                SceneSettingsComponent,
                                "primaryColor",
                            )("#" + val.getHexString())
                        }
                        className="w-full"
                    />
                    <ColorInput
                        disabled={
                            !state.thumbnailURL.value && !sceneSettingsComponent.thumbnailURL.value
                        }
                        value={new Color(sceneSettingsComponent.backgroundColor.value)}
                        onChange={val =>
                            updateProperty(
                                SceneSettingsComponent,
                                "backgroundColor",
                            )("#" + val.getHexString())
                        }
                        onRelease={val =>
                            commitProperty(
                                SceneSettingsComponent,
                                "backgroundColor",
                            )("#" + val.getHexString())
                        }
                        className="w-full"
                    />
                    <ColorInput
                        disabled={
                            !state.thumbnailURL.value && !sceneSettingsComponent.thumbnailURL.value
                        }
                        value={new Color(sceneSettingsComponent.alternativeColor.value)}
                        onChange={val =>
                            updateProperty(
                                SceneSettingsComponent,
                                "alternativeColor",
                            )("#" + val.getHexString())
                        }
                        onRelease={val =>
                            commitProperty(
                                SceneSettingsComponent,
                                "alternativeColor",
                            )("#" + val.getHexString())
                        }
                        className="w-full"
                    />
                    <Button onClick={generateColors} className="w-full">
                        {t("editor:properties.sceneSettings.generate")}
                    </Button>
                </div>
            </InputGroup>

            <InputGroup
                name="Kill Height"
                label={t("editor:properties.sceneSettings.lbl-killHeight")}
            >
                <NumericInput
                    value={sceneSettingsComponent.sceneKillHeight.value}
                    onChange={updateProperty(SceneSettingsComponent, "sceneKillHeight")}
                    onRelease={commitProperty(SceneSettingsComponent, "sceneKillHeight")}
                />
            </InputGroup>
        </PropertyGroup>
    );
};

SceneSettingsEditor.iconComponent = RiLandscapeLine;
export default SceneSettingsEditor;
