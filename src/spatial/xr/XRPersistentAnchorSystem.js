import { defineSystem } from "../../ecs/SystemFunctions";
import { getState } from "../../hyperflux";

import { ReferenceSpace, XRState } from "./XRState";
import { XRSystem } from "./XRSystem";

const createAnchor = async (xrFrame, position, rotation) => {
    const referenceSpace = ReferenceSpace.origin;
    if (xrFrame && referenceSpace) {
        const anchorPose = new XRRigidTransform(position, rotation);
        return await xrFrame.createAnchor?.(anchorPose, referenceSpace);
    } else {
        throw new Error("XRFrame not available.");
    }
};

const createPersistentAnchor = async (xrFrame, position, rotation) => {
    const referenceSpace = ReferenceSpace.origin;
    if (xrFrame && referenceSpace) {
        const anchorPose = new XRRigidTransform(position, rotation);
        const anchor = await xrFrame.createAnchor?.(anchorPose, referenceSpace);
        try {
            const handle = await anchor.requestPersistentHandle?.();
            return [anchor, handle];
        } catch (e) {
            anchor.delete();
            throw e;
        }
    } else {
        throw new Error("XRFrame not available.");
    }
};

const restoreAnchor = async (xrFrame, uuid) => {
    if (xrFrame?.session) {
        return await xrFrame.session.restorePersistentAnchor?.(uuid);
    } else {
        throw new Error("XRSession not available.");
    }
};

const deleteAnchor = async (xrFrame, uuid) => {
    if (xrFrame?.session) {
        await xrFrame.session.deletePersistentAnchor?.(uuid);
    } else {
        throw new Error("XRSession not available.");
    }
};

const anchors = new Set();
const anchorPoses = new Map();

export const XRAnchorFunctions = {
    createAnchor,
    createPersistentAnchor,
    restoreAnchor,
    deleteAnchor,
    anchors,
    anchorPoses,
};

const execute = () => {
    const frame = getState(XRState).xrFrame;
    if (!frame) return;

    const xrSpace = ReferenceSpace.origin;
    if (!xrSpace) return;

    if (frame.trackedAnchors) {
        const anchorsToRemove = [];

        for (const anchor of anchors) {
            if (!frame.trackedAnchors.has(anchor)) {
                anchorsToRemove.push(anchor);
            }
        }

        if (anchorsToRemove.length) {
            for (const anchor of anchorsToRemove) {
                anchors.delete(anchor);
            }
        }

        for (const anchor of frame.trackedAnchors) {
            if (!anchors.has(anchor)) {
                anchors.add(anchor);
            }
        }

        for (const anchor of anchors) {
            const knownPose = anchorPoses.get(anchor);
            const anchorPose = frame.getPose(anchor.anchorSpace, xrSpace);
            if (anchorPose) {
                if (knownPose === undefined) {
                    anchorPoses.set(anchor, anchorPose);
                } else {
                    const position = anchorPose.transform.position;
                    const orientation = anchorPose.transform.orientation;

                    const knownPosition = knownPose.transform.position;
                    const knownOrientation = knownPose.transform.orientation;

                    if (
                        position.x !== knownPosition.x ||
                        position.y !== knownPosition.y ||
                        position.z !== knownPosition.z ||
                        orientation.x !== knownOrientation.x ||
                        orientation.y !== knownOrientation.y ||
                        orientation.z !== knownOrientation.z ||
                        orientation.w !== knownOrientation.w
                    ) {
                        anchorPoses.set(anchor, anchorPose);
                    }
                }
            } else {
                if (knownPose !== undefined) {
                    // anchor pose changed
                }
            }
        }
    }
};

export const XRPersistentAnchorSystem = defineSystem({
    uuid: "ee.engine.XRPersistentAnchorSystem",
    insert: { with: XRSystem },
    execute,
});
