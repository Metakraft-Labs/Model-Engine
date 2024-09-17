import { useEffect } from "react";
import { Vector3 } from "three";

import { defineComponent, getComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { defineState, getMutableState, getState, matches } from "../../../hyperflux";
import { setCallback } from "../../../spatial/common/CallbackComponent";
import { XRState } from "../../../spatial/xr/XRState";

import { InputComponent } from "../../../spatial/input/components/InputComponent";
import { addError, clearErrors } from "../functions/ErrorFunctions";

const linkLogic = (linkEntity, xrState) => {
    const linkComponent = getComponent(linkEntity, LinkComponent);
    if (!linkComponent.sceneNav) {
        xrState && xrState.session?.end();
        typeof window === "object" && window && window.open(linkComponent.url, "_blank");
    } else {
        getMutableState(LinkState).location.set(linkComponent.location);
    }
};
const linkCallback = linkEntity => {
    const buttons = InputComponent.getMergedButtons(linkEntity);
    if (buttons.XRStandardGamepadTrigger?.down) {
        const xrState = getState(XRState);
        linkLogic(linkEntity, xrState);
    } else {
        linkLogic(linkEntity, undefined);
    }
};

const vec3 = new Vector3();
const interactMessage = "Click to follow";
const linkCallbackName = "linkCallback";

export const LinkState = defineState({
    name: "LinkState",
    initial: {
        location,
    },
});

export const LinkComponent = defineComponent({
    name: "LinkComponent",
    jsonID: "EE_link",

    onInit: _entity => {
        return {
            url: "",
            sceneNav: false,
            location: "",
        };
    },
    linkCallbackName,
    linkCallback,

    onSet: (entity, component, json) => {
        if (!json) return;
        matches.string.test(json.url) && component.url.set(json.url);
        matches.boolean.test(json.sceneNav) && component.sceneNav.set(json.sceneNav);
        matches.string.test(json.location) && component.location.set(json.location);
    },

    interactMessage,

    toJSON: (entity, component) => {
        return {
            url: component.url.value,
            sceneNav: component.sceneNav.value,
            location: component.location.value,
        };
    },

    errors: ["INVALID_URL"],

    reactor: function () {
        const entity = useEntityContext();
        const link = useComponent(entity, LinkComponent);

        useEffect(() => {
            clearErrors(entity, LinkComponent);
            if (link.sceneNav.value) return;
            try {
                new URL(link.url.value);
            } catch {
                return addError(entity, LinkComponent, "INVALID_URL", "Please enter a valid URL.");
            }
            return;
        }, [link.url, link.sceneNav]);

        useEffect(() => {
            setCallback(entity, linkCallbackName, () => LinkComponent.linkCallback(entity));
        }, []);

        return null;
    },
});
