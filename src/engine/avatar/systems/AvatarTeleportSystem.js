import { useEffect } from "react";
import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    DoubleSide,
    Line,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    Vector3,
} from "three";

import { getComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { createEntity, removeEntity } from "../../../ecs/EntityFunctions";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { defineState, dispatchAction, getMutableState, getState } from "../../../hyperflux";
import { CameraActions } from "../../../spatial/camera/CameraState";
import checkPositionIsValid from "../../../spatial/common/functions/checkPositionIsValid";
import { createTransitionState } from "../../../spatial/common/functions/createTransitionState";
import { easeOutCubic, normalizeRange } from "../../../spatial/common/functions/MathFunctions";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { InputSourceComponent } from "../../../spatial/input/components/InputSourceComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { setVisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { ReferenceSpace, XRAction, XRState } from "../../../spatial/xr/XRState";

import { EngineState } from "../../../spatial/EngineState";
import { Physics } from "../../../spatial/physics/classes/Physics";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { AvatarTeleportComponent } from ".././components/AvatarTeleportComponent";
import { teleportAvatar } from ".././functions/moveAvatar";
import { AvatarComponent } from "../components/AvatarComponent";
import { AvatarAnimationSystem } from "./AvatarAnimationSystem";

// Guideline parabola function
const positionAtT = (inVec, t, p, v, gravity) => {
    inVec.copy(p);
    inVec.addScaledVector(v, t);
    inVec.addScaledVector(gravity, 0.5 * t ** 2);
    return inVec;
};

// Utility Vectors
// Unit: m/s
const initialVelocity = 4;
const dynamicVelocity = 6;
const gravity = new Vector3(0, -9.8, 0);
const currentVertexLocal = new Vector3();
const currentVertexWorld = new Vector3();
const nextVertexWorld = new Vector3();
const tempVecP = new Vector3();
const tempVecV = new Vector3();

const white = new Color("white");
const red = new Color("red");

/**
 * @param position in world space
 * @param rotation in world space
 * @param initialVelocity
 * @param gravity
 * @returns
 */
const getParabolaInputParams = (position, rotation, initialVelocity, gravity) => {
    // Controller start position
    const p = tempVecP.copy(position);

    // Set Vector V to the direction of the controller, at 1m/s
    const v = tempVecV.set(0, 0, 1).applyQuaternion(rotation);

    // Scale the initial velocity
    let normalizedYDirection = 1 - normalizeRange(v.y, -1, 1);
    v.multiplyScalar(initialVelocity + dynamicVelocity * normalizedYDirection);

    // Time for tele ball to hit ground
    const t = (-v.y + Math.sqrt(v.y ** 2 - 2 * p.y * gravity.y)) / gravity.y;

    return {
        p,
        v,
        t,
    };
};

const stopGuidelineAtVertex = (vertex, line, startIndex, lineSegments) => {
    for (let i = startIndex; i <= lineSegments; i++) {
        vertex.toArray(line, i * 3);
    }
};

const AvatarTeleportSystemState = defineState({
    name: "AvatarTeleportSystemState",
    initial: {},
});

const lineSegments = 64; // segments to make a whole circle, uses far less
const lineGeometryVertices = new Float32Array((lineSegments + 1) * 3);
const lineGeometryColors = new Float32Array((lineSegments + 1) * 3);
const mat4 = new Matrix4();

let canTeleport = false;

const avatarTeleportQuery = defineQuery([AvatarTeleportComponent]);
let fadeBackInAccumulator = -1;

let visibleSegments = 2;

const execute = () => {
    const isCameraAttachedToAvatar = XRState.isCameraAttachedToAvatar;
    if (!isCameraAttachedToAvatar) return;
    const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();

    const { guideCursor, transition, guideline, guidelineEntity, guideCursorEntity, lineMaterial } =
        getState(AvatarTeleportSystemState);

    if (!guidelineEntity) return;

    if (fadeBackInAccumulator >= 0) {
        fadeBackInAccumulator += getState(ECSState).deltaSeconds;
        if (fadeBackInAccumulator > 0.25) {
            fadeBackInAccumulator = -1;
            teleportAvatar(
                selfAvatarEntity,
                getComponent(guideCursorEntity, TransformComponent).position,
            );
            dispatchAction(CameraActions.fadeToBlack({ in: false }));
            dispatchAction(
                XRAction.vibrateController({ handedness: "left", value: 0.5, duration: 100 }),
            );
            dispatchAction(
                XRAction.vibrateController({ handedness: "right", value: 0.5, duration: 100 }),
            );
        }
    }
    for (const entity of avatarTeleportQuery.exit()) {
        visibleSegments = 1;
        transition.setState("OUT");
        if (canTeleport) {
            fadeBackInAccumulator = 0;
            dispatchAction(CameraActions.fadeToBlack({ in: true }));
        }
    }
    for (const entity of avatarTeleportQuery.enter()) {
        setVisibleComponent(guidelineEntity, true);
        transition.setState("IN");
    }
    const guidelineTransform = getComponent(guidelineEntity, TransformComponent);

    const nonCapturedInputSources = InputSourceComponent.nonCapturedInputSources();

    for (const entity of avatarTeleportQuery()) {
        const side = getComponent(selfAvatarEntity, AvatarTeleportComponent).side;
        const referenceSpace = ReferenceSpace?.origin;

        for (const inputSourceEntity of nonCapturedInputSources) {
            const inputSourceComponent = getComponent(inputSourceEntity, InputSourceComponent);
            if (inputSourceComponent.source.handedness === side) {
                const pose = getState(XRState).xrFrame?.getPose(
                    inputSourceComponent.source.targetRaySpace,
                    referenceSpace,
                );
                guidelineTransform.position.copy(pose.transform.position);
                guidelineTransform.rotation.copy(pose.transform.orientation);
                guidelineTransform.matrix.fromArray(pose.transform.matrix);
            }
        }

        const guidelineTransformMatrixInverse = mat4.copy(guidelineTransform.matrix).invert();

        const { p, v, t } = getParabolaInputParams(
            guidelineTransform.position,
            guidelineTransform.rotation,
            initialVelocity,
            gravity,
        );
        lineGeometryVertices.fill(0);
        currentVertexLocal.set(0, 0, 0);
        let lastValidationData = null;
        let guidelineBlocked = false;
        let i = 0;
        if (visibleSegments < lineSegments) visibleSegments += 8;
        for (i = 1; i <= visibleSegments && !guidelineBlocked; i++) {
            // set vertex to current position of the virtual ball at time t
            positionAtT(currentVertexWorld, (i * t) / lineSegments, p, v, gravity);
            currentVertexLocal.copy(currentVertexWorld);
            currentVertexLocal.applyMatrix4(guidelineTransformMatrixInverse); // worldToLocal
            currentVertexLocal.toArray(lineGeometryVertices, i * 3);
            positionAtT(nextVertexWorld, ((i + 1) * t) / lineSegments, p, v, gravity);
            const currentVertexDirection = nextVertexWorld.subVectors(
                nextVertexWorld,
                currentVertexWorld,
            );
            const physicsWorld = Physics?.getWorld(selfAvatarEntity);
            const validationData = checkPositionIsValid(
                physicsWorld,
                currentVertexWorld,
                false,
                currentVertexDirection,
            );
            if (validationData.raycastHit !== null) {
                guidelineBlocked = true;
                currentVertexWorld.copy(validationData.raycastHit.position);
            }
            lastValidationData = validationData;
        }
        lastValidationData.positionValid ? (canTeleport = true) : (canTeleport = false);
        // Line should extend only up to last valid vertex
        currentVertexLocal.copy(currentVertexWorld);
        currentVertexLocal.applyMatrix4(guidelineTransformMatrixInverse); // worldToLocal
        currentVertexLocal.toArray(lineGeometryVertices, i * 3);
        stopGuidelineAtVertex(currentVertexLocal, lineGeometryVertices, i + 1, lineSegments);
        guideline.geometry.attributes.position.needsUpdate = true;
        if (canTeleport) {
            // Place the cursor near the end of the line
            getComponent(guideCursorEntity, TransformComponent).position.copy(currentVertexWorld);
            guideCursor.visible = true;
            lineMaterial.color = white;
        } else {
            guideCursor.visible = false;
            lineMaterial.color = red;
        }
        setVisibleComponent(guideCursorEntity, canTeleport);
    }
    const deltaSeconds = getState(ECSState).deltaSeconds;
    transition.update(deltaSeconds, alpha => {
        if (alpha === 0 && transition.state === "OUT") {
            setVisibleComponent(guidelineEntity, false);
            setVisibleComponent(guideCursorEntity, false);
        }
        const smoothedAlpha = easeOutCubic(alpha);
        guideCursor.material.opacity = smoothedAlpha;
        guideCursor.scale.setScalar(smoothedAlpha * 0.2 + 0.8);
    });
};

const reactor = () => {
    const cameraAttachedToAvatar = XRState.useCameraAttachedToAvatar();

    useEffect(() => {
        if (!cameraAttachedToAvatar) return;

        const originEntity = getState(EngineState).originEntity;

        const lineGeometry = new BufferGeometry();
        lineGeometryVertices.fill(0);
        lineGeometryColors.fill(0.5);
        lineGeometry.setAttribute("position", new BufferAttribute(lineGeometryVertices, 3));
        lineGeometry.setAttribute("color", new BufferAttribute(lineGeometryColors, 3));
        const lineMaterial = new LineBasicMaterial({
            vertexColors: true,
            blending: AdditiveBlending,
        });
        const guideline = new Line(lineGeometry, lineMaterial);
        guideline.frustumCulled = false;
        guideline.name = "teleport-guideline";

        const guidelineEntity = createEntity();
        addObjectToGroup(guidelineEntity, guideline);
        setComponent(guidelineEntity, NameComponent, "Teleport Guideline");
        setComponent(guidelineEntity, EntityTreeComponent, { parentEntity: originEntity });

        // The guide cursor at the end of the line
        const guideCursorGeometry = new RingGeometry(0.45, 0.5, 32);
        guideCursorGeometry.name = "teleport-guide-cursor";
        guideCursorGeometry.rotateX(-Math.PI / 2);
        guideCursorGeometry.translate(0, 0.01, 0);
        const guideCursorMaterial = new MeshBasicMaterial({
            color: 0xffffff,
            side: DoubleSide,
            transparent: true,
        });
        const guideCursor = new Mesh(guideCursorGeometry, guideCursorMaterial);
        guideCursor.frustumCulled = false;

        const guideCursorEntity = createEntity();
        addObjectToGroup(guideCursorEntity, guideCursor);
        setComponent(guideCursorEntity, NameComponent, "Teleport Guideline Cursor");
        setComponent(guideCursorEntity, EntityTreeComponent, { parentEntity: originEntity });

        const transition = createTransitionState(0.5);

        getMutableState(AvatarTeleportSystemState).set({
            guideCursor,
            transition,
            guideline,
            guidelineEntity,
            guideCursorEntity,
            lineMaterial,
        });

        return () => {
            removeEntity(guidelineEntity);
            removeEntity(guideCursorEntity);
            getMutableState(AvatarTeleportSystemState).set({});
        };
    }, [cameraAttachedToAvatar]);
    return null;
};

export const AvatarTeleportSystem = defineSystem({
    uuid: "ee.engine.AvatarTeleportSystem",
    insert: { after: AvatarAnimationSystem },
    execute,
    reactor,
});
