import { useEffect } from "react";
import { Vector3 } from "three";

import { UndefinedEntity, UUIDComponent } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import {
    dispatchAction,
    getMutableState,
    getState,
    matches,
    useHookstate,
    useMutableState,
} from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { setCallback } from "../../../spatial/common/CallbackComponent";
import { ArrowHelperComponent } from "../../../spatial/common/debug/ArrowHelperComponent";
import { matchesVector3 } from "../../../spatial/common/functions/MatchesUtils";
import { RendererState } from "../../../spatial/renderer/RendererState";

import { emoteAnimations, preloadedAnimations } from "../../avatar/animation/Util";
import { AvatarComponent } from "../../avatar/components/AvatarComponent";
import { AvatarControllerComponent } from "../../avatar/components/AvatarControllerComponent";
import { teleportAvatar } from "../../avatar/functions/moveAvatar";
import { AvatarNetworkAction } from "../../avatar/state/AvatarNetworkActions";
import {
    InteractableComponent,
    XRUIVisibilityOverride,
} from "../../interaction/components/InteractableComponent";
import { MountPointActions, MountPointState } from "../../interaction/functions/MountPointActions";
import { SittingComponent } from "./SittingComponent";

export const MountPoint = {
    seat: "seat",
};

/**
 * @todo refactor this into i18n and configurable
 */
const mountPointInteractMessages = {
    [MountPoint.seat]: "Press E to Sit",
};

const mountCallbackName = "mountEntity";

const mountEntity = (avatarEntity, mountEntity) => {
    if (avatarEntity === UndefinedEntity) return; //No avatar found, likely in edit mode for now
    const mountedEntities = getState(MountPointState);
    if (mountedEntities[getComponent(mountEntity, UUIDComponent)]) return; //already sitting, exiting

    const avatarUUID = getComponent(avatarEntity, UUIDComponent);
    const mountPoint = getOptionalComponent(mountEntity, MountPointComponent);
    if (!mountPoint || mountPoint.type !== MountPoint.seat) return;
    const mountPointUUID = getComponent(mountEntity, UUIDComponent);

    //check if we're already sitting or if the seat is occupied
    if (getState(MountPointState)[mountPointUUID] || hasComponent(avatarEntity, SittingComponent))
        return;

    setComponent(avatarEntity, SittingComponent, {
        mountPointEntity: mountEntity,
    });

    AvatarControllerComponent.captureMovement(avatarEntity, mountEntity);
    dispatchAction(
        AvatarNetworkAction.setAnimationState({
            animationAsset: preloadedAnimations.emotes,
            clipName: emoteAnimations.seated,
            loop: true,
            layer: 1,
            entityUUID: avatarUUID,
        }),
    );
    dispatchAction(
        MountPointActions.mountInteraction({
            mounted: true,
            mountedEntity: getComponent(avatarEntity, UUIDComponent),
            targetMount: getComponent(mountEntity, UUIDComponent),
        }),
    );
};

const unmountEntity = entity => {
    if (!hasComponent(entity, SittingComponent)) return;

    dispatchAction(
        AvatarNetworkAction.setAnimationState({
            animationAsset: preloadedAnimations.emotes,
            clipName: emoteAnimations.seated,
            needsSkip: true,
            entityUUID: getComponent(entity, UUIDComponent),
        }),
    );

    const sittingComponent = getComponent(entity, SittingComponent);

    AvatarControllerComponent.releaseMovement(entity, sittingComponent.mountPointEntity);
    dispatchAction(
        MountPointActions.mountInteraction({
            mounted: false,
            mountedEntity: getComponent(entity, UUIDComponent),
            targetMount: getComponent(sittingComponent.mountPointEntity, UUIDComponent),
        }),
    );
    const mountTransform = getComponent(sittingComponent.mountPointEntity, TransformComponent);
    const mountComponent = getComponent(sittingComponent.mountPointEntity, MountPointComponent);
    //we use teleport avatar only when rigidbody is not enabled, otherwise translation is called on rigidbody
    const dismountPoint = new Vector3()
        .copy(mountComponent.dismountOffset)
        .applyMatrix4(mountTransform.matrixWorld);
    teleportAvatar(entity, dismountPoint);
    removeComponent(entity, SittingComponent);
};

export const MountPointComponent = defineComponent({
    name: "MountPointComponent",
    jsonID: "EE_mount_point",

    onInit: _entity => {
        return {
            type: MountPoint.seat,
            dismountOffset: new Vector3(0, 0, 0.75),
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.string.test(json.type)) component.type.set(json.type);
        if (matchesVector3.test(json.dismountOffset))
            component.dismountOffset.set(json.dismountOffset);
    },

    toJSON: (entity, component) => {
        return {
            type: component.type.value,
            dismountOffset: component.dismountOffset.value,
        };
    },
    mountEntity,
    unmountEntity,
    mountCallbackName,
    mountPointInteractMessages,

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const mountPoint = useComponent(entity, MountPointComponent);
        const mountedEntities = useMutableState(MountPointState);

        useEffect(() => {
            setCallback(entity, mountCallbackName, () =>
                mountEntity(AvatarComponent.getSelfAvatarEntity(), entity),
            );
            // setComponent(entity, BoundingBoxComponent, {
            //   box: new Box3().setFromCenterAndSize(
            //     getComponent(entity, TransformComponent).position,
            //     new Vector3(0.1, 0.1, 0.1)
            //   )
            // })
        }, []);

        useEffect(() => {
            // manually hide interactable's XRUI when mounted through visibleComponent - (as interactable uses opacity to toggle visibility)
            const interactableComponent = getComponent(entity, InteractableComponent);
            if (interactableComponent) {
                interactableComponent.uiVisibilityOverride = mountedEntities[
                    getComponent(entity, UUIDComponent)
                ].value
                    ? XRUIVisibilityOverride.off
                    : XRUIVisibilityOverride.none;
            }
        }, [mountedEntities]);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, ArrowHelperComponent, { name: "mount-point-helper" });
            }
            return () => {
                removeComponent(entity, ArrowHelperComponent);
            };
        }, [debugEnabled]);

        return null;
    },
});
