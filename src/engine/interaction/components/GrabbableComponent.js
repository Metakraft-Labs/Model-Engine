import { useEffect } from "react";

import { getComponent, hasComponent, useEntityContext } from "../../../ecs";
import { defineComponent } from "../../../ecs/ComponentFunctions";
import { getState } from "../../../hyperflux";
import { setCallback } from "../../../spatial/common/CallbackComponent";
import { InputSourceComponent } from "../../../spatial/input/components/InputSourceComponent";
import { InputState } from "../../../spatial/input/state/InputState";

import { AvatarComponent } from "../../avatar/components/AvatarComponent";
import { dropEntity, grabEntity } from "../functions/grabbableFunctions";
import { InteractableComponent, XRUIVisibilityOverride } from "./InteractableComponent";

const grabbableCallbackName = "grabCallback";

/**
 * GrabbableComponent
 * - Allows an entity to be grabbed by a GrabberComponent
 */
export const GrabbableComponent = defineComponent({
    name: "GrabbableComponent",
    jsonID: "EE_grabbable", // TODO: rename to grabbable

    toJSON: () => true,

    grabbableCallbackName,

    reactor: function () {
        const entity = useEntityContext();
        useEffect(() => {
            setCallback(entity, grabbableCallbackName, () => grabCallback(entity));
        }, []);
        return null;
    },
});

const grabCallback = targetEntity => {
    const nonCapturedInputSources = InputSourceComponent.nonCapturedInputSources();
    for (const entity of nonCapturedInputSources) {
        const inputSource = getComponent(entity, InputSourceComponent);
        onGrab(targetEntity, inputSource.source.handedness === "left" ? "left" : "right");
    }
};
const updateUI = entity => {
    const isGrabbed = hasComponent(entity, GrabbedComponent);
    const interactable = getComponent(entity, InteractableComponent);
    interactable.uiVisibilityOverride = isGrabbed
        ? XRUIVisibilityOverride.off
        : XRUIVisibilityOverride.none;
};

const onGrab = (targetEntity, handedness = getState(InputState).preferredHand) => {
    const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();
    if (!hasComponent(targetEntity, GrabbableComponent)) return;
    const grabber = getComponent(selfAvatarEntity, GrabberComponent);
    const grabbedEntity = grabber[handedness];
    if (!grabbedEntity) return;
    if (grabbedEntity) {
        onDrop();
    } else {
        grabEntity(selfAvatarEntity, targetEntity, handedness);
    }
    updateUI(targetEntity);
};
export const onDrop = () => {
    const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();
    const grabber = getComponent(selfAvatarEntity, GrabberComponent);
    const handedness = getState(InputState).preferredHand;
    const grabbedEntity = grabber[handedness];
    if (!grabbedEntity) return;
    dropEntity(selfAvatarEntity);
    updateUI(grabbedEntity);
};

/**
 * GrabbedComponent
 * - Indicates that an entity is currently being grabbed by a GrabberComponent
 */
export const GrabbedComponent = defineComponent({
    name: "GrabbedComponent",

    onInit(entity) {
        return {
            attachmentPoint: "none",
            grabberEntity,
        };
    },

    onSet(entity, component, json) {
        if (!json) return;

        if (typeof json.attachmentPoint === "string")
            component.attachmentPoint.set(json.attachmentPoint);
        if (typeof json.grabberEntity === "number") component.grabberEntity.set(json.grabberEntity);
    },
});

/**
 * GrabberComponent
 * - Allows an entity to grab a GrabbableComponent
 */
export const GrabberComponent = defineComponent({
    name: "GrabberComponent",

    onInit(entity) {
        return {
            left,
            right,
        };
    },

    onSet(entity, component, json) {
        if (!json) return;
        if (typeof json.left === "number" || json.left === null) component.left.set(json.left);
        if (typeof json.right === "number" || json.right === null) component.right.set(json.right);
    },
});
