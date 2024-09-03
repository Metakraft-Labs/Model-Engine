import { XRJointAvatarBoneMap } from "../../../spatial/xr/XRComponents";

export const applyHandRotationFK = (vrm, handedness, rotations) => {
    const bones = Object.values(XRJointAvatarBoneMap);
    for (let i = 0; i < bones.length; i++) {
        const label = bones[i];
        const boneName = `${handedness}${label}`;
        const bone = vrm.humanoid.getNormalizedBone(boneName);
        if (!bone?.node) continue;
        bone.node.quaternion.fromArray(rotations, i * 4);
    }
};
