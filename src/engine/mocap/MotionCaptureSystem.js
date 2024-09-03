import { VRMHumanBoneList } from "@pixiv/three-vrm";
import { decode, encode } from "msgpackr";
import { useEffect } from "react";
import { Quaternion } from "three";

import { RingBuffer } from "../../common/src/utils/RingBuffer";
import { ECSState } from "../../ecs";
import { getComponent, removeComponent, setComponent } from "../../ecs/ComponentFunctions";
import { defineQuery } from "../../ecs/QueryFunctions";
import { defineSystem } from "../../ecs/SystemFunctions";
import { getState } from "../../hyperflux";
import { addDataChannelHandler, NetworkState, removeDataChannelHandler } from "../../network";

import { AvatarRigComponent } from "../avatar/components/AvatarAnimationComponent";
import { AvatarComponent } from "../avatar/components/AvatarComponent";
import { AvatarAnimationSystem } from "../avatar/systems/AvatarAnimationSystem";
import { MotionCaptureRigComponent } from "./MotionCaptureRigComponent";
import { solveMotionCapturePose } from "./solveMotionCapturePose";

export const sendResults = results => {
    return encode({
        timestamp: Date.now(),
        results,
    });
};

export const receiveResults = buff => {
    return decode(new Uint8Array(buff));
};

export const MotionCaptureFunctions = {
    sendResults,
    receiveResults,
};

export const mocapDataChannelType = "ee.core.mocap.dataChannel";

const handleMocapData = (network, dataChannel, fromPeerID, messageLike) => {
    if (network.isHosting) {
        network.bufferToAll(dataChannel, fromPeerID, message);
    }
    const results = MotionCaptureFunctions.receiveResults(message);
    if (!timeSeriesMocapData.has(fromPeerID)) {
        timeSeriesMocapData.set(fromPeerID, new RingBuffer(10));
    }
    timeSeriesMocapData.get(fromPeerID).add(results);
};

const motionCaptureQuery = defineQuery([MotionCaptureRigComponent, AvatarRigComponent]);

export const timeSeriesMocapData = new Map();
const timeSeriesMocapLastSeen = new Map();
/**@todo this will be determined by the average delta of incoming landmark data */
const slerpAlphaMultiplier = 25;
const execute = () => {
    const network = NetworkState.worldNetwork;
    if (!network) return;

    for (const [peerID, mocapData] of timeSeriesMocapData) {
        if (!network.peers[peerID] || timeSeriesMocapLastSeen.get(peerID) < Date.now() - 1000) {
            timeSeriesMocapData.delete(peerID);
            timeSeriesMocapLastSeen.delete(peerID);
        }
    }
    for (const [peerID, mocapData] of timeSeriesMocapData) {
        const data = mocapData.getFirst();
        const userID = network.peers[peerID].userId;
        const entity = AvatarComponent.getUserAvatarEntity(userID);
        if (!entity) continue;

        timeSeriesMocapLastSeen.set(peerID, Date.now());
        setComponent(entity, MotionCaptureRigComponent);
        solveMotionCapturePose(entity, data?.results.worldLandmarks, data?.results.landmarks);
        mocapData.clear(); // TODO: add a predictive filter and remove this
    }

    for (const entity of motionCaptureQuery()) {
        const peers = Object.keys(network.peers).find(peerID => timeSeriesMocapData.has(peerID));
        const rigComponent = getComponent(entity, AvatarRigComponent);
        if (!rigComponent.normalizedRig) continue;
        const worldHipsParent = rigComponent.normalizedRig.hips.node.parent;
        if (!peers) {
            removeComponent(entity, MotionCaptureRigComponent);
            worldHipsParent?.position.setY(0);
            continue;
        }
        for (const boneName of VRMHumanBoneList) {
            const normalizedBone = rigComponent.vrm.humanoid.normalizedHumanBones[boneName]?.node;
            if (!normalizedBone) continue;
            if (
                MotionCaptureRigComponent.rig[boneName].x[entity] === 0 &&
                MotionCaptureRigComponent.rig[boneName].y[entity] === 0 &&
                MotionCaptureRigComponent.rig[boneName].z[entity] === 0 &&
                MotionCaptureRigComponent.rig[boneName].w[entity] === 0
            ) {
                continue;
            }

            const slerpedQuat = new Quaternion()
                .set(
                    MotionCaptureRigComponent.slerpedRig[boneName].x[entity],
                    MotionCaptureRigComponent.slerpedRig[boneName].y[entity],
                    MotionCaptureRigComponent.slerpedRig[boneName].z[entity],
                    MotionCaptureRigComponent.slerpedRig[boneName].w[entity],
                )
                .normalize()
                .fastSlerp(
                    new Quaternion()
                        .set(
                            MotionCaptureRigComponent.rig[boneName].x[entity],
                            MotionCaptureRigComponent.rig[boneName].y[entity],
                            MotionCaptureRigComponent.rig[boneName].z[entity],
                            MotionCaptureRigComponent.rig[boneName].w[entity],
                        )
                        .normalize(),
                    getState(ECSState).deltaSeconds * slerpAlphaMultiplier,
                );

            normalizedBone.quaternion.copy(slerpedQuat);

            MotionCaptureRigComponent.slerpedRig[boneName].x[entity] = slerpedQuat.x;
            MotionCaptureRigComponent.slerpedRig[boneName].y[entity] = slerpedQuat.y;
            MotionCaptureRigComponent.slerpedRig[boneName].z[entity] = slerpedQuat.z;
            MotionCaptureRigComponent.slerpedRig[boneName].w[entity] = slerpedQuat.w;
        }

        const hipBone = rigComponent.normalizedRig.hips.node;
        hipBone.position.set(
            MotionCaptureRigComponent.hipPosition.x[entity],
            MotionCaptureRigComponent.hipPosition.y[entity],
            MotionCaptureRigComponent.hipPosition.z[entity],
        );

        // if (worldHipsParent)
        //   if (MotionCaptureRigComponent.solvingLowerBody[entity])
        //     worldHipsParent.position.setY(
        //       lerp(
        //         worldHipsParent.position.y,
        //         MotionCaptureRigComponent.footOffset[entity],
        //         getState(ECSState).deltaSeconds * 5
        //       )
        //     )
        //   else worldHipsParent.position.setY(0)
    }
};

const reactor = () => {
    useEffect(() => {
        addDataChannelHandler(mocapDataChannelType, handleMocapData);
        return () => {
            removeDataChannelHandler(mocapDataChannelType, handleMocapData);
        };
    }, []);
    return null;
};

export const MotionCaptureSystem = defineSystem({
    uuid: "ee.engine.MotionCaptureSystem",
    insert: { before: AvatarAnimationSystem },
    execute,
    reactor,
});
