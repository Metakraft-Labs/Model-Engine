import { Typography } from "@mui/material";
import React from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import { Vector3 } from "three";
import { FeatureFlags } from "../../../../../common/src/constants/FeatureFlags";
import { fileBrowserUploadPath } from "../../../../../common/src/schema.type.module";
import { processFileName } from "../../../../../common/src/utils/processFileName";
import { useComponent, useQuery } from "../../../../../ecs";
import { GLTFComponent } from "../../../../../engine/gltf/GLTFComponent";
import { ResourcePendingComponent } from "../../../../../engine/gltf/ResourcePendingComponent";
import useFeatureFlags from "../../../../../engine/useFeatureFlags";
import { useMutableState } from "../../../../../hyperflux";
import { TransformComponent } from "../../../../../spatial";
import LoadingView from "../../../../LoadingView";
import { ItemTypes, SupportedFileTypes } from "../../../constants/AssetTypes";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { addMediaNode } from "../../../functions/addMediaNode";
import { getCursorSpawnPosition } from "../../../functions/screenSpaceFunctions";
import { useEngineCanvas } from "../../../hooks/useEngineCanvas";
import { EditorState } from "../../../services/EditorServices";
import { uploadToFeathersService } from "../../../util/upload";
import GizmoTool from "../tools/GizmoTool";
import GridTool from "../tools/GridTool";
import PlayModeTool from "../tools/PlayModeTool";
import RenderModeTool from "../tools/RenderTool";
import SceneHelpersTool from "../tools/SceneHelpersTool";
import TransformPivotTool from "../tools/TransformPivotTool";
import TransformSnapTool from "../tools/TransformSnapTool";
import TransformSpaceTool from "../tools/TransformSpaceTool";

const ViewportDnD = ({ children }) => {
    const projectName = useMutableState(EditorState).projectName;

    const [{ isDragging }, dropRef] = useDrop({
        accept: [ItemTypes.Component, ...SupportedFileTypes],
        collect: monitor => ({
            isDragging: monitor.getItem() !== null && monitor.canDrop() && monitor.isOver(),
        }),
        drop(item, monitor) {
            const vec3 = new Vector3();
            getCursorSpawnPosition(monitor.getClientOffset(), vec3);
            if ("componentJsonID" in item) {
                EditorControlFunctions.createObjectFromSceneElement([
                    { name: item.componentJsonID },
                    { name: TransformComponent.jsonID, props: { position: vec3 } },
                ]);
            } else if ("url" in item) {
                addMediaNode(item.url, undefined, undefined, [
                    { name: TransformComponent.jsonID, props: { position: vec3 } },
                ]);
            } else if ("files" in item) {
                const dropDataTransfer = monitor.getItem();

                Promise.all(
                    Array.from(dropDataTransfer.files).map(async file => {
                        try {
                            const name = processFileName(file.name);
                            return uploadToFeathersService(fileBrowserUploadPath, [file], {
                                args: [
                                    {
                                        project: projectName.value,
                                        path: `assets/` + name,
                                        contentType: file.type,
                                    },
                                ],
                            }).promise;
                        } catch (err) {
                            toast.error(err.message);
                        }
                    }),
                ).then(urls => {
                    const vec3 = new Vector3();
                    urls.forEach(url => {
                        if (!url || url.length < 1 || !url[0] || url[0] === "") return;
                        addMediaNode(url[0], undefined, undefined, [
                            { name: TransformComponent.jsonID, props: { position: vec3 } },
                        ]);
                    });
                });
            }
        },
    });

    return (
        <div
            ref={dropRef}
            className={twMerge(
                "h-full w-full border border-white",
                isDragging ? "border-4" : "border-none",
            )}
        >
            {children}
        </div>
    );
};

const SceneLoadingProgress = ({ rootEntity }) => {
    const { t } = useTranslation();
    const progress = useComponent(rootEntity, GLTFComponent).progress.value;
    const loaded = GLTFComponent.useSceneLoaded(rootEntity);
    const resourcePendingQuery = useQuery([ResourcePendingComponent]);

    if (loaded) return null;

    return (
        <LoadingView
            fullSpace
            className="block h-12 w-12"
            containerClassname="absolute bg-black bg-opacity-70"
            title={t("editor:loadingScenesWithProgress", {
                progress,
                assetsLeft: resourcePendingQuery.length,
            })}
        />
    );
};

const ViewPortPanelContainer = () => {
    const { sceneName, rootEntity } = useMutableState(EditorState);

    const ref = React.useRef(null);
    const toolbarRef = React.useRef(null);

    useEngineCanvas(ref);

    const [transformPivotFeatureFlag] = useFeatureFlags([FeatureFlags.Studio.UI.TransformPivot]);

    return (
        <ViewportDnD>
            <div className="relative z-30 flex h-full w-full flex-col">
                <div ref={toolbarRef} className="z-10 flex gap-1 bg-theme-studio-surface p-1">
                    <TransformSpaceTool />
                    {transformPivotFeatureFlag && <TransformPivotTool />}
                    <GridTool />
                    <TransformSnapTool />
                    <SceneHelpersTool />
                    <div className="flex-1" />
                    <RenderModeTool />
                    <PlayModeTool />
                </div>
                {sceneName.value ? <GizmoTool viewportRef={ref} toolbarRef={toolbarRef} /> : null}
                {sceneName.value ? (
                    <>
                        <div
                            id="engine-renderer-canvas-container"
                            ref={ref}
                            className="absolute h-full w-full"
                        />
                        {rootEntity.value && (
                            <SceneLoadingProgress
                                key={rootEntity.value}
                                rootEntity={rootEntity.value}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full flex-col justify-center gap-2">
                        <Typography className="text-center">
                            Select a Scene in the Project to Start
                        </Typography>
                    </div>
                )}
            </div>
        </ViewportDnD>
    );
};

export default ViewPortPanelContainer;
