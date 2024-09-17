import {
    SnapMode,
    TransformPivot,
    TransformSpace,
} from "../../../engine/scene/constants/transformConstants";
import { getMutableState, getState } from "../../../hyperflux";

import { EditorHelperState } from "../services/EditorHelperState";

export const setTransformMode = mode => {
    getMutableState(EditorHelperState).transformMode.set(mode);
};

export const toggleSnapMode = () => {
    getMutableState(EditorHelperState).gridSnap.set(value =>
        value === SnapMode.Disabled ? SnapMode.Grid : SnapMode.Disabled,
    );
};

export const setTransformPivot = transformPivot => {
    getMutableState(EditorHelperState).transformPivot.set(transformPivot);
};

export const toggleTransformPivot = () => {
    const pivots = Object.keys(TransformPivot);
    const nextIndex =
        (pivots.indexOf(getState(EditorHelperState).transformPivot) + 1) % pivots.length;

    getMutableState(EditorHelperState).transformPivot.set(TransformPivot[pivots[nextIndex]]);
};

export const setTransformSpace = transformSpace => {
    getMutableState(EditorHelperState).transformSpace.set(transformSpace);
};

export const toggleTransformSpace = () => {
    getMutableState(EditorHelperState).transformSpace.set(transformSpace =>
        transformSpace === TransformSpace.world ? TransformSpace.local : TransformSpace.world,
    );
};
