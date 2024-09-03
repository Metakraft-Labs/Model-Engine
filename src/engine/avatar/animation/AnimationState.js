import {
    enterLocomotionState,
    getLocomotionStateActions,
    updateLocomotionState,
} from "./locomotionState";
import { enterSingleAnimationState, getSingleAnimationStateActions } from "./singleAnimationState";

const getMutableStateHandlers = () => {
    return {
        LocomotionState: {
            enter: enterLocomotionState,
            update: updateLocomotionState,
            getActions: getLocomotionStateActions,
        },
        SingleAnimationState: {
            enter: enterSingleAnimationState,
            update: () => {},
            getActions: getSingleAnimationStateActions,
        },
    };
};

export function fadeOutAnimationStateActions(state, duration = 0.1) {
    if (!state) return;
    const actions = getAnimationStateActions(state);
    actions.forEach(action => action.fadeOut(duration));
}

export function enterAnimationState(state, prevState) {
    if (!state) return;
    const handler = getMutableStateHandlers()[state.type];
    handler?.enter(state, prevState);
}

export function getAnimationStateActions(state) {
    if (!state) return [];
    const handler = getMutableStateHandlers()[state.type];
    return handler?.getActions(state);
}

export function updateAnimationState(state, delta) {
    if (!state) return;
    const handler = getMutableStateHandlers()[state.type];
    handler?.update(state, delta);
}
