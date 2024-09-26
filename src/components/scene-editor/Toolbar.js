import { Button } from "@mui/material";
import React from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { RxHamburgerMenu } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { locationPath } from "../../common/src/schema.type.module";
import { GLTFModifiedState } from "../../engine/gltf/GLTFDocumentState";
import { getMutableState, getState, useHookstate, useMutableState } from "../../hyperflux";
import { useFind } from "../../spatial/common/functions/FeathersHooks";
import { ContextMenu } from "../ContextMenu";
import { SidebarButton } from "../SidebarButton";
import AddEditSceneModal from "./AddEditSceneModal";
import CreateSceneDialog from "./dialogs/CreateScenePanelDialog";
import ImportSettingsPanel from "./dialogs/ImportSettingsPanelDialog";
import { SaveNewSceneDialog, SaveSceneDialog } from "./dialogs/SaveSceneDialog";
import { inputFileWithAddToScene } from "./functions/assetFunctions";
import { onNewScene } from "./functions/sceneFunctions";
import { cmdOrCtrlString } from "./functions/utils";
import { EditorState } from "./services/EditorServices";
import { PopoverState } from "./services/PopoverState";

const onImportAsset = async () => {
    const { projectName } = getState(EditorState);

    if (projectName) {
        try {
            await inputFileWithAddToScene({
                projectName,
                directoryPath: "projects/" + "default-project" + "/assets/",
            });
        } catch (err) {
            toast.error(err.message);
        }
    }
};

export const confirmSceneSaveIfModified = async () => {
    const isModified = EditorState.isModified();

    if (isModified) {
        return new Promise(resolve => {
            PopoverState.showPopupover(
                <SaveSceneDialog
                    isExiting
                    onConfirm={() => resolve(true)}
                    onCancel={() => resolve(false)}
                />,
            );
        });
    }
    return true;
};

const onClickNewScene = async () => {
    if (!(await confirmSceneSaveIfModified())) return;

    const newSceneUIAddons = getState(EditorState).uiAddons.newScene;
    if (Object.keys(newSceneUIAddons).length > 0) {
        PopoverState.showPopupover(<CreateSceneDialog open={true} />);
    } else {
        onNewScene();
    }
};

const onCloseProject = async navigate => {
    if (!(await confirmSceneSaveIfModified())) return;

    const editorState = getMutableState(EditorState);
    getMutableState(GLTFModifiedState).set({});
    editorState.projectName.set(null);
    editorState.scenePath.set(null);
    editorState.sceneName.set(null);
    navigate("/studio");

    const parsed = new URL(window.location.href);
    const query = parsed.searchParams;

    query.delete("project");
    query.delete("scenePath");

    parsed.search = query.toString();
    if (typeof history.pushState !== "undefined") {
        window.history.replaceState({}, "", parsed.toString());
    }
};

const generateToolbarMenu = () => {
    return [
        {
            name: "New Scene",
            action: onClickNewScene,
        },
        {
            name: "Save Scene",
            hotkey: `${cmdOrCtrlString}+s`,
            action: () => PopoverState.showPopupover(<SaveSceneDialog />),
        },
        {
            name: "Save As",
            action: () => PopoverState.showPopupover(<SaveNewSceneDialog />),
        },
        {
            name: "Import Settings",
            action: () => PopoverState.showPopupover(<ImportSettingsPanel />),
        },
        {
            name: "Import Assets",
            action: onImportAsset,
        },
        {
            name: "Close",
            action: onCloseProject,
        },
    ];
};

const toolbarMenu = generateToolbarMenu();

export default function Toolbar() {
    const navigate = useNavigate();
    const anchorEvent = useHookstate(null);
    const anchorPosition = useHookstate({ left: 0, top: 0 });

    const { projectName, sceneName, sceneAssetID } = useMutableState(EditorState);
    const locationQuery = useFind(locationPath, { query: { sceneId: sceneAssetID.value } });
    const currentLocation = locationQuery.data[0];

    return (
        <>
            <div className="flex items-center justify-between bg-theme-primary">
                <div className="flex items-center">
                    <div
                        className="ml-3 mr-6 cursor-pointer"
                        onClick={() => onCloseProject(navigate)}
                    >
                        <img
                            src="favicon-32x32.png"
                            alt="Spark Logo"
                            className={`h-7 w-7 opacity-50`}
                        />
                    </div>
                    <Button
                        endIcon={
                            <MdOutlineKeyboardArrowDown
                                size="1em"
                                className="-ml-3 text-[#A3A3A3]"
                            />
                        }
                        iconContainerClassName="ml-2 mr-1"
                        startIcon={<RxHamburgerMenu size={24} className="text-theme-input" />}
                        className="-mr-1 border-0 bg-transparent p-0"
                        onClick={event => {
                            anchorPosition.set({ left: event.clientX - 5, top: event.clientY - 2 });
                            anchorEvent.set(event);
                        }}
                    />
                </div>
                {/* TO BE ADDED */}
                {/* <div className="flex items-center gap-2.5 rounded-full bg-theme-surface-main p-0.5">
          <div className="rounded-2xl px-2.5">{t('editor:toolbar.lbl-simple')}</div>
          <div className="rounded-2xl bg-blue-primary px-2.5">{t('editor:toolbar.lbl-advanced')}</div>
        </div> */}
                <div className="flex items-center gap-2.5">
                    <span className="text-[#B2B5BD]">{projectName.value}</span>
                    <span>/</span>
                    <span>{sceneName.value}</span>
                </div>
                {sceneAssetID.value && (
                    <Button
                        rounded="none"
                        onClick={() =>
                            PopoverState.showPopupover(
                                <AddEditSceneModal
                                    sceneID={sceneAssetID.value}
                                    location={currentLocation}
                                />,
                            )
                        }
                    >
                        Publish
                    </Button>
                )}
            </div>
            <ContextMenu anchorEvent={anchorEvent.value} onClose={() => anchorEvent.set(null)}>
                <div className="flex w-fit min-w-44 flex-col gap-1 truncate rounded-lg bg-neutral-900 shadow-lg">
                    {toolbarMenu.map(({ name, action, hotkey }, index) => (
                        <div key={index}>
                            <SidebarButton
                                className="px-4 py-2.5 text-left font-light text-theme-input"
                                textContainerClassName="text-xs"
                                size="small"
                                fullWidth
                                onClick={() => {
                                    name === "Close" ? action(navigate) : action();
                                    anchorEvent.set(null);
                                }}
                                endIcon={hotkey}
                            >
                                {name}
                            </SidebarButton>
                        </div>
                    ))}
                </div>
            </ContextMenu>
        </>
    );
}
