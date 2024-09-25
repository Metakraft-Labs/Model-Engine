import { DockLayout } from "rc-dock";
import "rc-dock/dist/rc-dock.css";
import React, { Suspense, useCallback, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { listResources } from "../../apis/projects";
import { FeatureFlags } from "../../common/src/constants/FeatureFlags";
import { DndWrapper } from "../../components/DndWrapper";
import DragLayer from "../../components/DragLayer";
import LoadingView from "../../components/LoadingView";
import PopupMenu from "../../components/PopupMenu";
import ErrorDialog from "../../components/scene-editor/dialogs/ErrorDialog";
import { SaveSceneDialog } from "../../components/scene-editor/dialogs/SaveSceneDialog";
import { setCurrentEditorScene } from "../../components/scene-editor/functions/sceneFunctions";
import { cmdOrCtrlString } from "../../components/scene-editor/functions/utils";
import { AssetsPanelTab } from "../../components/scene-editor/panels/Assets";
import { FilesPanelTab } from "../../components/scene-editor/panels/Files";
import { HierarchyPanelTab } from "../../components/scene-editor/panels/Hierarchy";
import { MaterialsPanelTab } from "../../components/scene-editor/panels/Materials";
import { PropertiesPanelTab } from "../../components/scene-editor/panels/Properties";
import { ScenePanelTab } from "../../components/scene-editor/panels/Scenes";
import { ViewportPanelTab } from "../../components/scene-editor/panels/Viewport";
import { VisualScriptPanelTab } from "../../components/scene-editor/panels/VisualScript";
import { EditorErrorState } from "../../components/scene-editor/services/EditorErrorServices";
import { EditorState } from "../../components/scene-editor/services/EditorServices";
import { PopoverState } from "../../components/scene-editor/services/PopoverState";
import { SelectionState } from "../../components/scene-editor/services/SelectionServices";
import Toolbar from "../../components/scene-editor/Toolbar";
import useFeatureFlags from "../../engine/useFeatureFlags";
import {
    HyperFlux,
    NO_PROXY,
    getMutableState,
    useHookstate,
    useMutableState,
} from "../../hyperflux";
import { EngineState } from "../../spatial/EngineState";
import { destroySpatialEngine, initializeSpatialEngine } from "../../spatial/initializeEngine";
import "./EditorContainer.css";

export const DockContainer = ({ children, id = "editor-dock", dividerAlpha = 0 }) => {
    const dockContainerStyles = {
        "--dividerAlpha": dividerAlpha,
    };

    return (
        <div id={id} className="dock-container" style={dockContainerStyles}>
            {children}
        </div>
    );
};

const onEditorError = error => {
    console.error(error);
    if (error["aborted"]) {
        PopoverState.hidePopupover();
        return;
    }

    PopoverState.showPopupover(
        <ErrorDialog
            title={error.title || "Error"}
            description={error.message || "There was an unknown error."}
        />,
    );
};

const defaultLayout = flags => {
    const tabs = [ScenePanelTab, FilesPanelTab, AssetsPanelTab];
    flags.visualScriptPanelEnabled && tabs.push(VisualScriptPanelTab);

    return {
        dockbox: {
            mode: "horizontal",
            children: [
                {
                    mode: "vertical",
                    size: 8,
                    children: [
                        {
                            tabs: [ViewportPanelTab],
                        },
                        {
                            tabs: tabs,
                        },
                    ],
                },
                {
                    mode: "vertical",
                    size: 3,
                    children: [
                        {
                            tabs: [HierarchyPanelTab, MaterialsPanelTab],
                        },
                        {
                            tabs: [PropertiesPanelTab],
                        },
                    ],
                },
            ],
        },
    };
};

export default function EditorPage() {
    const { sceneAssetID, scenePath, uiEnabled, uiAddons, sceneName, projectName } =
        useMutableState(EditorState);

    const currentLoadedSceneURL = useHookstate(null);

    const findResources = useCallback(async () => {
        const { data: scenes } = await listResources({
            limit: 1,
            filters: { type: "scene", key: scenePath.value },
        });
        const scene = scenes[0];
        if (!scene) {
            console.error("Scene not found");
            sceneName.set(null);
            sceneAssetID.set(null);
            currentLoadedSceneURL.set(null);
            return;
        }
        projectName.set(scene.projectName);
        sceneName.set(scene.key.split("/").pop() ?? null);
        sceneAssetID.set(scene.id);
        currentLoadedSceneURL.set(scene.url);
    }, [scenePath.value]);

    useEffect(() => {
        findResources();
    }, [findResources]);

    useEffect(() => {
        if (HyperFlux.store) {
            initializeSpatialEngine();
            return () => {
                destroySpatialEngine();
            };
        }
    }, [HyperFlux.store]);

    const originEntity = useMutableState(EngineState).originEntity.value;

    useEffect(() => {
        if (!sceneAssetID.value || !currentLoadedSceneURL.value || !originEntity) return;
        return setCurrentEditorScene(currentLoadedSceneURL.value, sceneAssetID.value);
    }, [originEntity, currentLoadedSceneURL.value]);

    const errorState = useHookstate(getMutableState(EditorErrorState).error);

    const dockPanelRef = useRef(null);

    useHotkeys(`${cmdOrCtrlString}+s`, e => {
        e.preventDefault();
        PopoverState.showPopupover(<SaveSceneDialog />);
    });

    const [visualScriptPanelEnabled] = useFeatureFlags([FeatureFlags.Studio.Panel.VisualScript]);

    useEffect(() => {
        return () => {
            getMutableState(SelectionState).selectedEntities.set([]);
        };
    }, [scenePath]);

    useEffect(() => {
        if (errorState.value) {
            onEditorError(errorState.value);
        }
    }, [errorState]);

    useEffect(() => {
        const handleBeforeUnload = async event => {
            if (EditorState.isModified()) {
                event.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    return (
        <Suspense
            fallback={
                <LoadingView fullScreen className="block h-12 w-12" title={"Loading Studio"} />
            }
        >
            <main className="pointer-events-auto bg-primary">
                <div
                    id="editor-container"
                    className="flex flex-col bg-black"
                    style={scenePath.value ? { background: "transparent" } : {}}
                >
                    {uiEnabled.value && (
                        <DndWrapper id="editor-container">
                            <DragLayer />
                            <Toolbar />
                            <div className="mt-1 flex overflow-hidden">
                                <DockContainer>
                                    <DockLayout
                                        ref={dockPanelRef}
                                        defaultLayout={defaultLayout({ visualScriptPanelEnabled })}
                                        style={{
                                            position: "absolute",
                                            left: 5,
                                            top: 45,
                                            right: 5,
                                            bottom: 5,
                                            background: "black",
                                        }}
                                    />
                                </DockContainer>
                            </div>
                        </DndWrapper>
                    )}
                    {Object.entries(uiAddons.container.get(NO_PROXY)).map(([_key, value]) => {
                        return value;
                    })}
                </div>
                <PopupMenu />
            </main>
        </Suspense>
    );
}
