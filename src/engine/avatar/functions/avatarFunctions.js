import { VRM, VRMHumanBoneList, VRMHumanoid } from "@pixiv/three-vrm";
import { AnimationClip, AnimationMixer, Box3, Matrix4, Vector3 } from "three";

// import { retargetSkeleton, syncModelSkeletons } from '../animation/retargetSkeleton'
import {
    getComponent,
    getMutableComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";
import { getMutableState, getState } from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { iOS } from "../../../spatial/common/functions/isMobile";
import { setObjectLayers } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { iterateEntityNode } from "../../../spatial/transform/components/EntityTree";
import { computeTransformMatrix } from "../../../spatial/transform/systems/TransformSystem";
import { XRState } from "../../../spatial/xr/XRState";

import { ModelComponent } from "../../scene/components/ModelComponent";
import { getRootSpeed } from "../animation/AvatarAnimationGraph";
import { preloadedAnimations } from "../animation/Util";
import { AnimationState } from "../AnimationManager";
import avatarBoneMatching from "../AvatarBoneMatching";
import { AnimationComponent } from "../components/AnimationComponent";
import { AvatarRigComponent } from "../components/AvatarAnimationComponent";
import { AvatarComponent } from "../components/AvatarComponent";
import { AvatarControllerComponent } from "../components/AvatarControllerComponent";
import { AvatarDissolveComponent } from "../components/AvatarDissolveComponent";
import { AvatarPendingComponent } from "../components/AvatarPendingComponent";
import { AvatarMovementSettingsState } from "../state/AvatarMovementSettingsState";
import { LocalAvatarState } from "../state/AvatarState";
import { bindAnimationClipFromMixamo } from "./retargetMixamoRig";

/** Checks if the asset is a VRM. If not, attempt to use
 *  Mixamo based naming schemes to autocreate necessary VRM humanoid objects. */
export const autoconvertMixamoAvatar = model => {
    const scene = model.scene ?? model; // FBX assets do not have 'scene' property
    if (!scene) return null;
    let foundModel = model;
    //sometimes, for some exporters, the vrm object is stored in the userData
    if (model.userData?.vrm instanceof VRM) {
        if (model.userData.vrmMeta.metaVersion > 0) return model.userData.vrm;
        foundModel = model.userData.vrm;
    }

    //vrm0 is an instance of the vrm object
    if (foundModel instanceof VRM) {
        const bones = foundModel.humanoid.rawHumanBones;
        foundModel.humanoid.normalizedHumanBonesRoot.removeFromParent();
        bones.hips.node.rotateY(Math.PI);
        const humanoid = new VRMHumanoid(bones);
        const vrm = new VRM({
            ...foundModel,
            humanoid,
            scene: foundModel.scene,
            meta: { name: foundModel.scene.children[0].name },
        });
        if (!vrm.userData) vrm.userData = {};
        return vrm;
    }

    return avatarBoneMatching(foundModel);
};

export const isAvaturn = url => {
    const fileExtensionRegex = /\.[0-9a-z]+$/i;
    const avaturnUrl = process.env.avaturnAPI;
    if (avaturnUrl && !fileExtensionRegex.test(url)) return url.startsWith(avaturnUrl);
    return false;
};

/**tries to load avatar model asset if an avatar is not already pending */
export const loadAvatarModelAsset = (entity, avatarURL) => {
    if (!avatarURL) return;
    //check if the url to the file is an avaturn url to infer the file type
    const pendingComponent = getOptionalComponent(entity, AvatarPendingComponent);
    if (pendingComponent && pendingComponent.url === avatarURL) return;

    setComponent(entity, AvatarPendingComponent, { url: avatarURL });
    if (hasComponent(entity, AvatarControllerComponent))
        AvatarControllerComponent.captureMovement(entity, entity);

    setComponent(entity, ModelComponent, {
        src: avatarURL,
        cameraOcclusion: false,
        convertToVRM: true,
    });
};

export const unloadAvatarForUser = async entity => {
    setComponent(entity, ModelComponent, { src: "" });
    removeComponent(entity, AvatarPendingComponent);
};

const hipsPos = new Vector3(),
    headPos = new Vector3(),
    leftFootPos = new Vector3(),
    leftToesPos = new Vector3(),
    rightFootPos = new Vector3(),
    leftLowerLegPos = new Vector3(),
    leftUpperLegPos = new Vector3(),
    footGap = new Vector3(),
    eyePos = new Vector3(),
    size = new Vector3(),
    box = new Box3();

export const setupAvatarProportions = (entity, vrm) => {
    iterateEntityNode(entity, computeTransformMatrix, e => hasComponent(e, TransformComponent));

    box.expandByObject(vrm.scene).getSize(size);

    const rawRig = vrm.humanoid.rawHumanBones;
    rawRig.hips.node.getWorldPosition(hipsPos);
    rawRig.head.node.getWorldPosition(headPos);
    rawRig.leftFoot.node.getWorldPosition(leftFootPos);
    rawRig.rightFoot.node.getWorldPosition(rightFootPos);
    rawRig.leftToes && rawRig.leftToes.node.getWorldPosition(leftToesPos);
    rawRig.leftLowerLeg.node.getWorldPosition(leftLowerLegPos);
    rawRig.leftUpperLeg.node.getWorldPosition(leftUpperLegPos);
    rawRig.leftEye
        ? rawRig.leftEye?.node.getWorldPosition(eyePos)
        : eyePos.copy(headPos).setY(headPos.y + 0.1); // fallback to rough estimation if no eye bone is present

    const avatarComponent = getMutableComponent(entity, AvatarComponent);
    avatarComponent.avatarHeight.set(size.y);
    avatarComponent.torsoLength.set(Math.abs(headPos.y - hipsPos.y));
    avatarComponent.upperLegLength.set(Math.abs(hipsPos.y - leftLowerLegPos.y));
    avatarComponent.lowerLegLength.set(Math.abs(leftLowerLegPos.y - leftFootPos.y));
    avatarComponent.hipsHeight.set(hipsPos.y);
    avatarComponent.eyeHeight.set(eyePos.y);
    avatarComponent.footHeight.set(leftFootPos.y);
    avatarComponent.footGap.set(footGap.subVectors(leftFootPos, rightFootPos).length());
    // angle from ankle to toes along YZ plane
    rawRig.leftToes &&
        avatarComponent.footAngle.set(
            Math.atan2(leftFootPos.z - leftToesPos.z, leftFootPos.y - leftToesPos.y),
        );

    //set ik matrices for blending into normalized rig
    const rig = vrm.humanoid.normalizedHumanBones;
    rig.hips.node.updateWorldMatrix(false, true);
    const rigComponent = getComponent(entity, AvatarRigComponent);
    //get list of bone names for arms and legs
    const boneNames = VRMHumanBoneList.filter(
        bone =>
            bone.includes("Arm") ||
            bone.includes("Leg") ||
            bone.includes("Foot") ||
            bone.includes("Hand"),
    );
    for (const bone of boneNames) {
        rigComponent.ikMatrices[bone] = {
            world: new Matrix4().copy(rig[bone]?.node.matrixWorld),
            local: new Matrix4().copy(rig[bone]?.node.matrix),
        };
    }
};

/**Kicks off avatar animation loading and setup. Called after an avatar's model asset is
 * successfully loaded.
 */
export const setupAvatarForUser = (entity, model) => {
    const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();

    setComponent(entity, AvatarRigComponent, {
        normalizedRig: model.humanoid.normalizedHumanBones,
        rawRig: model.humanoid.rawHumanBones,
    });

    setObjectLayers(model.scene, ObjectLayers.Avatar);

    const loadingEffect =
        getState(AnimationState).avatarLoadingEffect && !getState(XRState).sessionActive && !iOS;

    removeComponent(entity, AvatarPendingComponent);

    if (hasComponent(entity, AvatarControllerComponent))
        AvatarControllerComponent.releaseMovement(entity, entity);

    if (loadingEffect) {
        const avatarHeight = getComponent(entity, AvatarComponent).avatarHeight;
        setComponent(entity, AvatarDissolveComponent, {
            height: avatarHeight,
        });
    }

    if (entity === selfAvatarEntity) getMutableState(LocalAvatarState).avatarReady.set(true);
};

export const retargetAvatarAnimations = entity => {
    const rigComponent = getComponent(entity, AvatarRigComponent);
    const manager = getState(AnimationState);
    const animations = [];
    for (const key in manager.loadedAnimations) {
        for (const animation of manager.loadedAnimations[key].animations)
            animations.push(bindAnimationClipFromMixamo(animation, rigComponent.vrm));
    }
    setComponent(entity, AnimationComponent, {
        animations: animations,
        mixer: new AnimationMixer(rigComponent.vrm.humanoid.normalizedHumanBonesRoot),
    });
};

/**
 * @todo: stop using global state for avatar speed
 * in future this will be derrived from the actual root motion of a
 * given avatar's locomotion animations
 */
export const setAvatarSpeedFromRootMotion = () => {
    const manager = getState(AnimationState);
    const run = manager.loadedAnimations[preloadedAnimations.locomotion].animations[4] ?? [
        new AnimationClip(),
    ];
    const walk = manager.loadedAnimations[preloadedAnimations.locomotion].animations[6] ?? [
        new AnimationClip(),
    ];
    const movement = getMutableState(AvatarMovementSettingsState);
    if (run) movement.runSpeed.set(getRootSpeed(run));
    if (walk) movement.walkSpeed.set(getRootSpeed(walk));
};

export const getAvatarBoneWorldPosition = (entity, boneName, position) => {
    const avatarRigComponent = getOptionalComponent(entity, AvatarRigComponent);
    if (!avatarRigComponent || !avatarRigComponent.normalizedRig) return false;
    const bone = avatarRigComponent.normalizedRig[boneName];
    if (!bone) return false;
    const el = bone.node.matrixWorld.elements;
    position.set(el[12], el[13], el[14]);
    return true;
};
