import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlinePlusCircle } from "react-icons/hi2";
import { listResources } from "../../../../../apis/projects";
import { getMutableState, useHookstate, useMutableState } from "../../../../../hyperflux";
import Button from "../../../../Button";
import LoadingView from "../../../../LoadingView";
import { SceneItem } from "../../../admin/scene/SceneItem";
import CreateSceneDialog from "../../../dialogs/CreateScenePanelDialog";
import { onNewScene } from "../../../functions/sceneFunctions";
import { EditorState } from "../../../services/EditorServices";
import { PopoverState } from "../../../services/PopoverState";
import { confirmSceneSaveIfModified } from "../../../toolbar/Toolbar";

export default function ScenesPanel() {
    const { t } = useTranslation();
    const editorState = useMutableState(EditorState);
    const [scenesLoading, setScenesLoading] = useState(true);
    const [scenes, setScenes] = useState([]);

    const getScenes = useCallback(async () => {
        setScenesLoading(true);
        const { data } = await listResources({
            filters: { type: "scene" },
            limit: 100,
        });

        setScenes(data);
        setScenesLoading(false);
    }, []);

    useEffect(() => {
        getScenes();
    }, [getScenes]);

    const onClickScene = async scene => {
        if (!(await confirmSceneSaveIfModified())) return;

        getMutableState(EditorState).merge({
            scenePath: scene.key,
        });
    };

    // useRealtime(fileBrowserPath, scenesQuery.refetch);

    const isCreatingScene = useHookstate(false);
    const handleCreateScene = async () => {
        isCreatingScene.set(true);
        const newSceneUIAddons = editorState.uiAddons.newScene.value;
        if (Object.keys(newSceneUIAddons).length > 0) {
            PopoverState.showPopupover(<CreateSceneDialog />);
        } else {
            await onNewScene();
        }
        isCreatingScene.set(false);
    };

    return (
        <div className="h-full bg-theme-primary">
            <div className="mb-4 w-full bg-theme-surface-main">
                <Button
                    startIcon={<HiOutlinePlusCircle />}
                    endIcon={
                        isCreatingScene.value && <LoadingView spinnerOnly className="h-4 w-4" />
                    }
                    disabled={isCreatingScene.value}
                    rounded="none"
                    className="ml-auto bg-theme-highlight px-2"
                    size="small"
                    onClick={handleCreateScene}
                >
                    New Scene
                </Button>
            </div>
            <div className="h-full bg-theme-primary">
                {scenesLoading ? (
                    <LoadingView
                        title={t("editor:loadingScenes")}
                        fullSpace
                        className="block h-12 w-12"
                    />
                ) : (
                    <div className="relative h-full flex-1 overflow-y-auto px-4 py-3 pb-8">
                        <div className="flex flex-wrap gap-4 pb-8">
                            {scenes.map(scene => (
                                <SceneItem
                                    key={scene.id}
                                    scene={scene}
                                    updateEditorState
                                    moveMenuUp={true}
                                    handleOpenScene={() => onClickScene(scene)}
                                    refetchProjectsData={getScenes}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
