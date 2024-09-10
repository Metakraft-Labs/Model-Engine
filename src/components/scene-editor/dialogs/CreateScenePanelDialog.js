import { Button } from "@mui/material";
import React from "react";
import { NO_PROXY, useMutableState } from "../../../hyperflux";
import Modal from "../../Modal";
import { onNewScene } from "../functions/sceneFunctions";
import { EditorState } from "../services/EditorServices";
import { PopoverState } from "../services/PopoverState";

export default function CreateSceneDialog({ open }) {
    const element = useMutableState(EditorState).uiAddons.newScene.get(NO_PROXY);
    return (
        <Modal heading={"New Scene"} open={open} onClose={PopoverState.hidePopupover}>
            <div className="flex justify-center">
                <Button
                    size="small"
                    variant="outline"
                    sx={{
                        width: "10vw",
                    }}
                    onClick={() => {
                        onNewScene();
                        PopoverState.hidePopupover();
                    }}
                >
                    New Empty Scene
                </Button>
            </div>
            <div className="flex justify-center">{Object.values(element).map(value => value)}</div>
        </Modal>
    );
}
