import { Engine, UUIDComponent } from "../../../ecs";
import { defineComponent, getComponent } from "../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { matches } from "../../../hyperflux";
import { NetworkObjectComponent } from "../../../network";

export const AvatarComponent = defineComponent({
    name: "AvatarComponent",

    onInit: entity => {
        return {
            /** The total height of the avatar in a t-pose, must always be non zero and positive for the capsule collider */
            avatarHeight: 1.8,
            /** The length of the torso in a t-pose, from the hip joint to the head joint */
            torsoLength: 0,
            /** The length of the upper leg in a t-pose, from the hip joint to the knee joint */
            upperLegLength: 0,
            /** The length of the lower leg in a t-pose, from the knee joint to the ankle joint */
            lowerLegLength: 0,
            /** The height of the foot in a t-pose, from the ankle joint to the bottom of the avatar's model */
            footHeight: 0,
            /** The height of the hips in a t-pose */
            hipsHeight: 0,
            /** The length of the arm in a t-pose, from the shoulder joint to the elbow joint */
            armLength: 0,
            /** The distance between the left and right foot in a t-pose */
            footGap: 0,
            /** The angle of the foot in a t-pose */
            footAngle: 0,
            /** The height of the eyes in a t-pose */
            eyeHeight: 0,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.number.test(json.avatarHeight)) component.avatarHeight.set(json.avatarHeight);
        if (matches.number.test(json.torsoLength)) component.torsoLength.set(json.torsoLength);
        if (matches.number.test(json.upperLegLength))
            component.upperLegLength.set(json.upperLegLength);
        if (matches.number.test(json.lowerLegLength))
            component.lowerLegLength.set(json.lowerLegLength);
        if (matches.number.test(json.footHeight)) component.footHeight.set(json.footHeight);
        if (matches.number.test(json.hipsHeight)) component.hipsHeight.set(json.hipsHeight);
        if (matches.number.test(json.footGap)) component.footGap.set(json.footGap);
        if (matches.number.test(json.eyeHeight)) component.eyeHeight.set(json.eyeHeight);
    },

    /**
     * Get the user avatar entity (the network object w/ an Avatar component)
     * @param userId
     * @returns
     */
    getUserAvatarEntity(userId) {
        return avatarNetworkObjectQuery().find(
            eid => getComponent(eid, NetworkObjectComponent).ownerId === userId,
        );
    },

    getSelfAvatarEntity() {
        return UUIDComponent.getEntityByUUID(Engine.instance.userID + "_avatar");
    },

    useSelfAvatarEntity() {
        return UUIDComponent.useEntityByUUID(Engine.instance.userID + "_avatar");
    },
});

const avatarNetworkObjectQuery = defineQuery([NetworkObjectComponent, AvatarComponent]);
