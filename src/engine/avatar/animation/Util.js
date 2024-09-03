import { Quaternion, Vector3 } from "three";

import { matches } from "../../../hyperflux";
import { matchesVector3 } from "../../../spatial/common/functions/MatchesUtils";

export const ikTargets = {
    rightHand: "rightHand",
    leftHand: "leftHand",
    rightFoot: "rightFoot",
    leftFoot: "leftFoot",
    head: "head",
    hips: "hips",

    rightElbowHint: "rightElbowHint",
    leftElbowHint: "leftElbowHint",
    rightKneeHint: "rightKneeHint",
    leftKneeHint: "leftKneeHint",
};

/** list out all the emote animation file names */
export const emoteAnimations = {
    dance1: "Dance1",
    dance2: "Dance2",
    dance3: "Dance3",
    dance4: "Dance4",
    clap: "Clap",
    wave: "Wave",
    kiss: "Kiss",
    cry: "Cry",
    laugh: "Laugh",
    defeat: "Defeat",
    falling: "Falling",
    seated: "Seated",
};

/** the file names of preloaded animation bundles */
export const preloadedAnimations = {
    locomotion: "locomotion",
    emotes: "emotes",
};

export const defaultAnimationPath = `/projects/spark/default-project/assets/animations/`;

export const matchesIkTarget = matches.some(...Object.keys(ikTargets).map(k => matches.literal(k)));

const matchesMovementType = matches.shape({
    /** Velocity of the avatar */
    velocity: matchesVector3,
    /** Distance from the ground of the avatar */
    distanceFromGround: matches.number,
});

/** Type of calculate weights method parameters */
export const matchesWeightsParameters = matches.partial({
    movement: matchesMovementType,
    resetAnimation: matches.boolean,
    forceTransition: matches.boolean,
});

export function mapPositionTrackToDistanceTrack(track, rot, scale) {
    const { times, values } = track;

    const distTrack = { times: times, values: new Float32Array(times.length) };

    if (!times.length) {
        return distTrack;
    }

    const startPos = new Vector3();
    const vec1 = new Vector3();

    startPos.set(values[0], values[1], values[2]).applyQuaternion(rot).multiply(scale);
    startPos.y = 0;

    times.forEach((time, i) => {
        const j = i * 3;
        vec1.set(values[j], values[j + 1], values[j + 2])
            .applyQuaternion(rot)
            .multiply(scale);
        vec1.y = 0;

        distTrack.values[i] = vec1.sub(startPos).length();
    });

    return distTrack;
}

export function findAnimationClipTrack(animation, objName, attr) {
    const trackName = `${objName}.${attr}`;
    return animation?.tracks?.find(track => track.name === trackName);
}

export const computeRootAnimationVelocity = (track, quat, scale) => {
    return computeRootAnimationDistance(track, quat, scale) / getTrackDuration(track);
};

const getTrackDuration = track => {
    return track.times[track.times.length - 1];
};

const computeRootAnimationDistance = (track, quat, scale) => {
    const rootVec = computeRootMotionVector(track);
    rootVec.applyQuaternion(quat).multiply(scale);
    rootVec.y = 0;
    return rootVec.length();
};

const computeRootMotionVector = track => {
    const startPos = new Vector3(),
        endPos = new Vector3(),
        values = track.values,
        length = values.length;

    startPos.set(values[0], values[1], values[2]);
    endPos.set(values[length - 3], values[length - 2], values[length - 1]);

    return endPos.sub(startPos);
};

export function findRootBone(skinnedMesh) {
    return skinnedMesh.skeleton.bones.find(obj => obj.parent?.type !== "Bone");
}

export const processRootAnimation = (clip, rootBone) => {
    if (!rootBone || !clip || !clip.name.endsWith("root")) return null;

    const meshQuat = new Quaternion(),
        meshScale = new Vector3();
    meshScale.setScalar(1);

    const posTrack = findAnimationClipTrack(clip, rootBone.node.name, "position");
    const velocity = computeRootAnimationVelocity(posTrack, meshQuat, meshScale);
    const distTrack = mapPositionTrackToDistanceTrack(posTrack, meshQuat, meshScale);

    return {
        velocity: velocity,
        distanceTrack: distTrack,
    };
};
