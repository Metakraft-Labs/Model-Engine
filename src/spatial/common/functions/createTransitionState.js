import { MathUtils } from "three";
import { ECSState } from "../../../ecs/ECSState";
import { useExecute } from "../../../ecs/SystemFunctions";
import { AnimationSystemGroup } from "../../../ecs/SystemGroups";
import { getState, NO_PROXY, useHookstate } from "../../../hyperflux";

export const createTransitionState = (transitionPeriodSeconds, initialState = "OUT") => {
    let currentState = initialState;
    let alpha = initialState === "IN" ? 1 : 0;
    let _lastAlpha = -1;

    const setState = state => {
        currentState = state;
    };

    const update = (delta, callback) => {
        if (alpha < 1 && currentState === "IN") alpha += delta / transitionPeriodSeconds;
        if (alpha > 0 && currentState === "OUT") alpha -= delta / transitionPeriodSeconds;

        if (alpha !== _lastAlpha) {
            alpha = MathUtils.clamp(alpha, 0, 1);
            callback(alpha);
            _lastAlpha = alpha;
        }
    };

    return {
        get state() {
            return currentState;
        },
        get alpha() {
            return alpha;
        },
        setState,
        update,
    };
};

export const useAnimationTransition = (
    transitionPeriodSeconds,
    initialState = "OUT",
    onTransition,
) => {
    const state = useHookstate(() => createTransitionState(transitionPeriodSeconds, initialState));

    useExecute(
        () => {
            const deltaSeconds = getState(ECSState).deltaSeconds;
            state.get(NO_PROXY).update(deltaSeconds, onTransition);
        },
        { with: AnimationSystemGroup },
    );

    return newState => {
        state.get(NO_PROXY).setState(newState);
    };
};
