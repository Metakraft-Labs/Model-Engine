import { dispatchAction } from "../../hyperflux";

import { RegisteredWidgets, WidgetAppActions } from "./WidgetAppService";

/**
 * The widget interface.
 *
 * @param {XRUI} ui stores a reference to the XRUI container, entity and state
 * @param {string} label is the display label of the widget
 * @param {any} icon is the icon to display on the widget menu
 * @param {Function} system is a system that will run while a widget is enabled and visible
 */

export const WidgetName = {
    PROFILE: "ProfileMenu",
    SETTINGS: "SettingsMenu",
    SOCIALS: "SocialsMenu",
    LOCATION: "LocationMenu",
    ADMIN_CONTROLS: "AdminControlsMenu",
    MEDIA_SESSION: "MediaSessionMenu",
    CHAT: "Chat",
    EMOTE: "Emote",
    READY_PLAYER: "ReadyPlayer",
    SELECT_AVATAR: "SelectAvatar",
    SHARE_LOCATION: "ShareLocation",
    UPLOAD_AVATAR: "UploadAvatar",
};

export const registerWidget = (xruiEntity, widget) => {
    const id = `${widget.label}-${xruiEntity}`;
    dispatchAction(WidgetAppActions.registerWidget({ id }));
    RegisteredWidgets.set(id, widget);
    return id;
};

export const Widgets = {
    registerWidget,
};
