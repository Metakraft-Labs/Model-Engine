import { defineState } from "../../hyperflux";

export const AnimationState = defineState({
    name: "AnimationState",
    initial: () => ({
        loadedAnimations: {},
        avatarLoadingEffect: false,
    }),
});
