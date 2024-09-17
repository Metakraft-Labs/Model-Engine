import React from "react";
import { useTranslation } from "react-i18next";

import { PopoverState } from "../../../services/PopoverState";

import isValidSceneName from "../../../../../common/src/utils/validateSceneName";
import { useHookstate } from "../../../../../hyperflux";
import Input from "../../../../Input";
import Modal from "../../../../Modal/Modal2";

export default function RenameSceneModal({
    sceneName,
    updateEditorState,
    scene,
    refetchProjectsData,
}) {
    const { t } = useTranslation();
    const newSceneName = useHookstate(sceneName);
    const inputError = useHookstate("");

    const handleSubmit = async () => {
        if (!isValidSceneName(newSceneName.value)) {
            inputError.set(t("editor:errors.invalidSceneName"));
            return;
        }
        const currentURL = scene.key;
        const newURL = currentURL.replace(
            currentURL.split("/").pop(),
            newSceneName.value + ".gltf",
        );
        // const newData = await renameScene(scene, newURL, scene.project);
        refetchProjectsData();

        if (updateEditorState) {
            // getMutableState(EditorState).scenePath.set(newData[0].key);
        }

        PopoverState.hidePopupover();
    };

    return (
        <Modal
            title={t("editor:hierarchy.lbl-renameScene")}
            className="w-[50vw] max-w-2xl"
            onSubmit={handleSubmit}
            onClose={PopoverState.hidePopupover}
            submitButtonDisabled={newSceneName.value === sceneName || inputError.value.length > 0}
        >
            <Input
                value={newSceneName.value}
                onChange={event => {
                    inputError.set("");
                    newSceneName.set(event.target.value);
                }}
                description={t("editor:dialog.saveNewScene.info-name")}
                error={inputError.value}
            />
        </Modal>
    );
}
