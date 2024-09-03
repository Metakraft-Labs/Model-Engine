import { LoopOnce, LoopRepeat } from "three";

import { fadeOutAnimationStateActions } from "./AnimationState";

export function getSingleAnimationStateActions(state) {
    return [state.action];
}

export function enterSingleAnimationState(state, prevState) {
    fadeOutAnimationStateActions(prevState);
    const { action } = state;
    action.reset();
    if (state.loop) {
        action.setLoop(LoopRepeat, Infinity).fadeIn(0.1).play();
    } else {
        action.setLoop(LoopOnce, 1).fadeIn(0.1).play();
        action.clampWhenFinished = state.clamp;
    }
}
