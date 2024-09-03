import { defineState, syncStateWithLocalStorage } from "../../../hyperflux";

export const AvatarAxesControlScheme = {
    Move: "AvatarControlScheme_Move",
    Teleport: "AvatarControlScheme_Teleport",
};

export const AvatarControllerType = {
    None: "AvatarControllerType_None",
    XRHands: "AvatarControllerType_XRHands",
    OculusQuest: "AvatarControllerType_OculusQuest",
};

export const AvatarInputSettingsState = defineState({
    name: "AvatarInputSettingsState",
    initial: () => ({
        controlType: AvatarControllerType.None,
        leftAxesControlScheme: AvatarAxesControlScheme.Move,
        rightAxesControlScheme: AvatarAxesControlScheme.Teleport,
        invertRotationAndMoveSticks: true,
        showAvatar: true,
    }),
    extension: syncStateWithLocalStorage([
        "controlType",
        "leftAxesControlScheme",
        "rightAxesControlScheme",
        "invertRotationAndMoveSticks",
        "showAvatar",
    ]),
});
