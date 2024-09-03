import { defineState } from "../../../hyperflux";

export const LocalAvatarState = defineState({
    name: "ee.engine.LocalAvatarState",
    initial: {
        avatarReady: false,
    },
});
