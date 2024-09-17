import {
    SnapMode,
    TransformMode,
    TransformPivot,
    TransformSpace,
} from "../../../engine/scene/constants/transformConstants";
import { defineState, syncStateWithLocalStorage } from "../../../hyperflux";
import { EditorMode } from "../constants/EditorModeTypes";

export const PlacementMode = {
    DRAG: "DRAG",
    CLICK: "CLICK",
};

export const EditorHelperState = defineState({
    name: "EditorHelperState",
    initial: () => ({
        editorMode: EditorMode.Simple,
        transformMode: TransformMode.translate,
        transformModeOnCancel: TransformMode.translate,
        transformSpace: TransformSpace.local,
        transformPivot: TransformPivot.Selection,
        gridSnap: SnapMode.Grid,
        translationSnap: 0.5,
        rotationSnap: 10,
        scaleSnap: 0.1,
        placementMode: PlacementMode.DRAG,
    }),
    extension: syncStateWithLocalStorage([
        "snapMode",
        "translationSnap",
        "rotationSnap",
        "scaleSnap",
    ]),
});
