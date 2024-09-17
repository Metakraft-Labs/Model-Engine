import { Tooltip, Typography } from "@mui/material";
import { default as React, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BsThreeDotsVertical } from "react-icons/bs";
import { LuTrash } from "react-icons/lu";
import { MdOutlineEdit } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { timeAgo } from "../../../../common/src/utils/datetime-sql";
import { useClickOutside } from "../../../../common/src/utils/useClickOutside";
import { useHookstate, useMutableState } from "../../../../hyperflux";
import Button from "../../../Button";
import ConfirmDialog from "../../../ConfirmDialog";
import RenameSceneModal from "../../panels/Scenes/modals/RenameScene";
import { EditorState } from "../../services/EditorServices";
import { PopoverState } from "../../services/PopoverState";

export const SceneItem = ({
    scene,
    updateEditorState,
    moveMenuUp,
    handleOpenScene,
    refetchProjectsData,
}) => {
    const { t } = useTranslation();
    const editorState = useMutableState(EditorState);

    const sceneName = scene.key.split("/").pop()?.replace(".gltf", "");

    const deleteSelectedScene = async scene => {
        if (scene) {
            // await deleteScene(scene.key)

            if (updateEditorState) {
                if (editorState.sceneAssetID.value === scene.id) {
                    editorState.sceneName.set(null);
                    editorState.sceneAssetID.set(null);
                }
            } else {
                refetchProjectsData();
            }
        }
        PopoverState.hidePopupover();
    };

    const showContentMenu = useHookstate(false);
    const menuPosition = useHookstate({ top: 0, left: 0 });

    const threeDotsContainRef = useRef < HTMLDivElement > null;

    useClickOutside(threeDotsContainRef, () => showContentMenu.set(false));

    useEffect(() => {
        if (!threeDotsContainRef.current) return;

        let animationFrameId;

        const updatePosition = () => {
            if (!threeDotsContainRef.current) return;
            const rect = threeDotsContainRef.current.getBoundingClientRect();
            menuPosition.set({ top: rect.bottom, left: rect.left });
            animationFrameId = requestAnimationFrame(updatePosition);
        };

        updatePosition();

        return () => cancelAnimationFrame(animationFrameId);
    }, [threeDotsContainRef]);

    return (
        <div className="col-span-2 inline-flex h-64 w-64 min-w-64 max-w-64 cursor-pointer flex-col items-start justify-start gap-3 rounded-lg bg-theme-highlight p-3 lg:col-span-1">
            <img
                className="shrink grow basis-0 self-stretch rounded"
                src={scene.thumbnailURL}
                onClick={handleOpenScene}
            />
            <div className="inline-flex items-start justify-between self-stretch">
                <div className="inline-flex w-full flex-col items-start justify-start">
                    <div className="space-between flex w-full flex-row">
                        <Typography
                            variant="h3"
                            fontWeight="light"
                            className="leading-6 text-neutral-100"
                        >
                            <Tooltip title={sceneName}>
                                <div className="w-52 truncate">{sceneName}</div>
                            </Tooltip>
                        </Typography>
                    </div>
                    <Typography
                        variant="h3"
                        fontSize="xs"
                        fontWeight="light"
                        className="h-3.5 w-40 leading-5 text-neutral-100"
                    >
                        {t("editor:hierarchy.lbl-edited")}{" "}
                        {t("common:timeAgo", { time: timeAgo(new Date(scene.updatedAt)) })}
                    </Typography>
                </div>
                <div className="relative h-6 w-6" ref={threeDotsContainRef}>
                    <Button
                        variant="transparent"
                        size="small"
                        className="px-2 py-1.5"
                        startIcon={<BsThreeDotsVertical className="text-neutral-100" />}
                        onClick={() => showContentMenu.set(v => !v)}
                    />
                    <ul
                        className={twMerge(
                            "fixed z-10 block w-max translate-x-5 rounded-lg bg-theme-primary px-4 py-3 pr-10",
                            showContentMenu.value ? "visible" : "hidden",
                            moveMenuUp ? "-translate-y-10" : "",
                        )}
                        style={{
                            top: menuPosition.top.value,
                            left: menuPosition.left.value,
                        }}
                    >
                        <li className="h-8">
                            <Button
                                variant="transparent"
                                size="medium"
                                className="h-full p-0 text-zinc-400 hover:text-[var(--text-primary)]"
                                startIcon={<MdOutlineEdit />}
                                onClick={() => {
                                    showContentMenu.set(false);
                                    PopoverState.showPopupover(
                                        <RenameSceneModal
                                            sceneName={sceneName}
                                            scene={scene}
                                            updateEditorState={updateEditorState}
                                            refetchProjectsData={refetchProjectsData}
                                        />,
                                    );
                                }}
                            >
                                {t("editor:hierarchy.lbl-rename")}
                            </Button>
                        </li>
                        <li className="h-8">
                            <Button
                                variant="transparent"
                                size="medium"
                                className="h-full p-0 text-zinc-400 hover:text-[var(--text-primary)]"
                                startIcon={<LuTrash />}
                                onClick={() => {
                                    showContentMenu.set(false);
                                    PopoverState.showPopupover(
                                        <ConfirmDialog
                                            title={t("editor:hierarchy.lbl-deleteScene")}
                                            text={t("editor:hierarchy.lbl-deleteSceneDescription", {
                                                sceneName,
                                            })}
                                            onSubmit={async () => deleteSelectedScene(scene)}
                                        />,
                                    );
                                }}
                            >
                                {t("editor:hierarchy.lbl-delete")}
                            </Button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
