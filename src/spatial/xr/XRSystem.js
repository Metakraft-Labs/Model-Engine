import { useEffect } from "react";

import { defineSystem } from "../../ecs/SystemFunctions";
import { InputSystemGroup } from "../../ecs/SystemGroups";
import { defineActionQueue, getMutableState } from "../../hyperflux";

import { xrSessionChanged } from "./XRSessionFunctions";
import { XRAction, XRState } from "./XRState";

/**
 * System for XR session and input handling
 */

const updateSessionSupportForMode = mode => {
    navigator.xr
        ?.isSessionSupported(mode)
        .then(supported => getMutableState(XRState).supportedSessionModes[mode].set(supported));
};

const updateSessionSupport = () => {
    updateSessionSupportForMode("inline");
    updateSessionSupportForMode("immersive-ar");
    updateSessionSupportForMode("immersive-vr");
};

const xrSessionChangedQueue = defineActionQueue(XRAction.sessionChanged.matches);

const execute = () => {
    for (const action of xrSessionChangedQueue()) xrSessionChanged(action);
};

const reactor = () => {
    useEffect(() => {
        navigator.xr?.addEventListener("devicechange", updateSessionSupport);
        updateSessionSupport();

        return () => {
            navigator.xr?.removeEventListener("devicechange", updateSessionSupport);
        };
    }, []);
    return null;
};

export const XRSystem = defineSystem({
    uuid: "ee.engine.XRSystem",
    insert: { before: InputSystemGroup },
    execute,
    reactor,
});
