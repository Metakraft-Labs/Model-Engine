import { VRMHumanBoneList } from "@pixiv/three-vrm";
import { Matrix4, Quaternion, Vector3 } from "three";

import { getComponent, getOptionalComponent, hasComponent } from "../../../ecs/ComponentFunctions";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { AvatarComponent } from "../components/AvatarComponent";
import { BoneComponent } from "../components/BoneComponent";

export const updateVRMRetargeting = (vrm, avatarEntity) => {
    const humanoidRig = vrm.humanoid._normalizedHumanBones; // as VRMHumanoidRig
    for (const boneName of VRMHumanBoneList) {
        const boneNode = humanoidRig.original.getBoneNode(boneName);

        if (boneNode != null) {
            const rigBoneNode = humanoidRig.getBoneNode(boneName);

            delete TransformComponent.dirtyTransforms[rigBoneNode.entity];

            const parentWorldRotation = humanoidRig._parentWorldRotations[boneName];
            const invParentWorldRotation = _quatA.copy(parentWorldRotation).invert();
            const boneRotation = humanoidRig._boneRotations[boneName];

            boneNode.quaternion
                .copy(rigBoneNode.quaternion)
                .multiply(parentWorldRotation)
                .premultiply(invParentWorldRotation)
                .multiply(boneRotation);

            if (boneName === "hips") {
                const entity = boneNode.entity;
                const parentEntity = getOptionalComponent(
                    entity,
                    EntityTreeComponent,
                )?.parentEntity;
                if (!parentEntity) continue;
                const parentBone =
                    getOptionalComponent(parentEntity, BoneComponent) ??
                    getOptionalComponent(parentEntity, TransformComponent);
                if (!parentBone) continue;
                _boneWorldPos.copy(rigBoneNode.position).applyMatrix4(parentBone?.matrixWorld);
                _parentWorldMatrixInverse.copy(parentBone.matrixWorld).invert();

                _boneWorldPos.applyMatrix4(_parentWorldMatrixInverse);
                if (hasComponent(avatarEntity, AvatarComponent)) {
                    _boneWorldPos.multiplyScalar(
                        getComponent(avatarEntity, AvatarComponent).hipsHeight,
                    );
                }
                boneNode.position.copy(_boneWorldPos);
            }
        }
    }
};

const _quatA = new Quaternion();
const _boneWorldPos = new Vector3();
const _parentWorldMatrixInverse = new Matrix4();
