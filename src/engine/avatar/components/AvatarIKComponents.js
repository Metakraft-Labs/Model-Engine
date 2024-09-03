import { Types } from "bitecs";
import { useEffect } from "react";
import { Quaternion, Vector3 } from "three";

import { UUIDComponent } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    getOptionalComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, useHookstate } from "../../../hyperflux";
import { NetworkObjectComponent } from "../../../network";
import { AxesHelperComponent } from "../../../spatial/common/debug/AxesHelperComponent";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { ObjectLayerMasks } from "../../../spatial/renderer/constants/ObjectLayers";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { AvatarRigComponent } from "./AvatarAnimationComponent";

export const AvatarHeadDecapComponent = defineComponent({
    name: "AvatarHeadDecapComponent",
});

export const AvatarIKTargetComponent = defineComponent({
    name: "AvatarIKTargetComponent",
    schema: { blendWeight: Types.f64 },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).avatarDebug);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, AxesHelperComponent, {
                    name: "avatar-ik-helper",
                    size: 0.5,
                    layerMask: ObjectLayerMasks.AvatarHelper,
                });
            }

            return () => {
                removeComponent(entity, AxesHelperComponent);
            };
        }, [debugEnabled]);

        return null;
    },

    getTargetEntity: (ownerID, targetName) => {
        return UUIDComponent.getEntityByUUID(ownerID + targetName);
    },
});

/**
 * Gets the hand position in world space
 * @param entity the player entity
 * @param hand which hand to get
 * @returns {Vector3}
 */

const vec3 = new Vector3();
const quat = new Quaternion();

export const getHandTarget = (entity, hand) => {
    const networkComponent = getComponent(entity, NetworkObjectComponent);

    const targetEntity = NameComponent.entitiesByName[networkComponent.ownerId + "_" + hand]?.[0]; // todo, how should be choose which one to use?
    if (targetEntity && AvatarIKTargetComponent.blendWeight[targetEntity] > 0)
        return getComponent(targetEntity, TransformComponent);

    const rig = getOptionalComponent(entity, AvatarRigComponent);
    if (!rig?.rawRig) return getComponent(entity, TransformComponent);

    switch (hand) {
        case "left":
            return {
                position: rig.rawRig.leftHand.node.getWorldPosition(vec3),
                rotation: rig.rawRig.leftHand.node.getWorldQuaternion(quat),
            };
        case "right":
            return {
                position: rig.rawRig.rightHand.node.getWorldPosition(vec3),
                rotation: rig.rawRig.rightHand.node.getWorldQuaternion(quat),
            };
        default:
        case "none":
            return {
                position: rig.rawRig.head.node.getWorldPosition(vec3),
                rotation: rig.rawRig.head.node.getWorldQuaternion(quat),
            };
    }
};
