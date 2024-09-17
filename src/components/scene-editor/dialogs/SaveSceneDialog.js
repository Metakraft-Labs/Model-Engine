import { Box, Button, CircularProgress, TextField } from "@mui/material";
import React from "react";
import isValidSceneName from "../../../common/src/utils/validateSceneName";
import { getComponent } from "../../../ecs";
import { GLTFModifiedState } from "../../../engine/gltf/GLTFDocumentState";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { getMutableState, getState, none, useHookstate } from "../../../hyperflux";
import Modal from "../../Modal";
import { saveSceneGLTF } from "../functions/sceneFunctions";
import { EditorState } from "../services/EditorServices";
import { PopoverState } from "../services/PopoverState";
import ErrorDialog from "./ErrorDialog";

export const SaveSceneDialog = props => {
    const modalProcessing = useHookstate(false);

    const handleSubmit = async () => {
        modalProcessing.set(true);
        const { sceneAssetID, projectName, sceneName, rootEntity } = getState(EditorState);
        const sceneModified = EditorState.isModified();

        if (!projectName) {
            PopoverState.hidePopupover();
            if (props.onCancel) props.onCancel();
            return;
        } else if (!sceneName) {
            PopoverState.hidePopupover();
            PopoverState.showPopupover(
                <SaveNewSceneDialog onConfirm={props.onConfirm} onCancel={props.onCancel} />,
            );
            return;
        } else if (!sceneModified) {
            PopoverState.hidePopupover();
            if (props.onCancel) props.onCancel();
            return;
        }

        const abortController = new AbortController();

        try {
            await saveSceneGLTF(sceneAssetID, projectName, sceneName, abortController.signal);
            const sourceID = getComponent(rootEntity, SourceComponent);
            getMutableState(GLTFModifiedState)[sourceID].set(none);

            PopoverState.hidePopupover();
            if (props.onConfirm) props.onConfirm();
        } catch (error) {
            console.error(error);
            PopoverState.showPopupover(
                <ErrorDialog
                    title={"Error Saving Project"}
                    description={error.message || "There was an error when saving the project."}
                />,
            );
            if (props.onCancel) props.onCancel();
        }
        modalProcessing.set(false);
    };

    return (
        <Modal
            heading={props.isExiting ? "Unsaved Changes" : "Save"}
            onSubmit={handleSubmit}
            open={true}
            onClose={() => {
                PopoverState.hidePopupover();
                if (props.onCancel) props.onCancel();
            }}
            subHeading={
                props.isExiting
                    ? "Are you sure you want to save the scene?"
                    : "Do you want to save the current scene?"
            }
        >
            <Box display={flex} justifyContent={"space-between"}>
                <Button color={"success"} onClick={handleSubmit}>
                    Save
                </Button>
                <Button
                    color={"error"}
                    onClick={() => {
                        PopoverState.hidePopupover();
                        if (props.onCancel) props.onCancel();
                    }}
                >
                    Cancel
                </Button>
            </Box>
        </Modal>
    );
};

export const SaveNewSceneDialog = props => {
    const inputSceneName = useHookstate("New-Scene");
    const modalProcessing = useHookstate(false);
    const inputError = useHookstate("");

    const handleSubmit = async () => {
        if (!isValidSceneName(inputSceneName.value)) {
            inputError.set("Scene name is invalid");
            return;
        }

        modalProcessing.set(true);
        const { projectName, sceneName, rootEntity, sceneAssetID } = getState(EditorState);
        const sceneModified = EditorState.isModified();
        const abortController = new AbortController();
        try {
            if (sceneName || sceneModified) {
                if (inputSceneName.value && projectName) {
                    await saveSceneGLTF(
                        sceneAssetID,
                        projectName,
                        inputSceneName.value,
                        abortController.signal,
                        true,
                    );

                    const sourceID = getComponent(rootEntity, SourceComponent);
                    getMutableState(GLTFModifiedState)[sourceID].set(none);
                }
            }
            PopoverState.hidePopupover();
            if (props.onConfirm) props.onConfirm();
        } catch (error) {
            PopoverState.hidePopupover();
            if (props.onCancel) props.onCancel();
            console.error(error);
            PopoverState.showPopupover(
                <ErrorDialog
                    title={"Error saving the project"}
                    description={error?.message || "There was an error when saving the project."}
                />,
            );
        }
        modalProcessing.set(false);
    };

    return (
        <Modal
            heading={"Save AZs"}
            onClose={() => {
                PopoverState.hidePopupover();
                if (props.onCancel) props.onCancel();
            }}
            open={props?.open}
        >
            <TextField
                value={inputSceneName.value}
                onChange={event => {
                    inputError.set("");
                    inputSceneName.set(event.target.value);
                }}
                label={"Scene name"}
                helperText={
                    "Name must be between 4 and 64 characters (with only alphabets, numbers, dashes allowed)"
                }
                error={inputError.value}
            />
            <Button
                disabled={inputError.value.length > 0 || modalProcessing.value}
                endIcon={modalProcessing.value ? <CircularProgress /> : ""}
                onClick={handleSubmit}
            >
                Submit
            </Button>
        </Modal>
    );
};
