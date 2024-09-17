import RAPIER, {
    ActiveCollisionTypes,
    ActiveEvents,
    ColliderDesc,
    EventQueue,
    QueryFilterFlags,
    Ray,
    RigidBodyDesc,
    ShapeType,
    World,
} from "@dimforge/rapier3d-compat";
import { Box3, Matrix4, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three";

import {
    getComponent,
    getOptionalComponent,
    hasComponent,
    setComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";

import { UUIDComponent } from "../../../ecs";
import { RigidBodyType } from "../../../engine/scene/components/OldColliderComponent";
import { defineState, none, useHookstate } from "../../../hyperflux";
import { NO_PROXY, getMutableState, getState } from "../../../hyperflux/StateFunctions";
import { Vector3_Zero } from "../../common/constants/MathConstants";
import { smootheLerpAlpha } from "../../common/functions/MathLerpFunctions";
import { MeshComponent } from "../../renderer/components/MeshComponent";
import { SceneComponent } from "../../renderer/components/SceneComponents";
import {
    getAncestorWithComponent,
    useAncestorWithComponent,
} from "../../transform/components/EntityTree";
import { TransformComponent } from "../../transform/components/TransformComponent";
import { computeTransformMatrix } from "../../transform/systems/TransformSystem";
import { ColliderComponent } from "../components/ColliderComponent";
import { CollisionComponent } from "../components/CollisionComponent";
import { RigidBodyComponent } from "../components/RigidBodyComponent";
import { TriggerComponent } from "../components/TriggerComponent";
import { CollisionGroups } from "../enums/CollisionGroups";
import { getInteractionGroups } from "../functions/getInteractionGroups";
import { BodyTypes, CollisionEvents, RapierShapeToString, Shapes } from "../types/PhysicsTypes";

async function load() {
    return RAPIER.init();
}

export const RapierWorldState = defineState({
    name: "ir.spatial.physics.RapierWorldState",
    initial: {},
});

function createWorld(id, args = { gravity: { x: 0.0, y: -9.81, z: 0.0 }, substeps: 1 }) {
    const world = new World(args.gravity);

    world.id = id;
    world.substeps = args.substeps;
    world.cameraAttachedRigidbodyEntity = UndefinedEntity;

    const Colliders = new Map();
    const Rigidbodies = new Map();
    const Controllers = new Map();

    world.Colliders = Colliders;
    world.Rigidbodies = Rigidbodies;
    world.Controllers = Controllers;

    world.collisionEventQueue = createCollisionEventQueue();
    world.drainCollisions = Physics.drainCollisionEventQueue(world);
    world.drainContacts = Physics.drainContactEventQueue(world);

    getMutableState(RapierWorldState)[id].set(world);

    return world;
}

function destroyWorld(id) {
    const world = getState(RapierWorldState)[id];
    if (!world) throw new Error("Physics world not found");
    getMutableState(RapierWorldState)[id].set(none);
    world.Colliders.clear();
    world.Rigidbodies.clear();
    world.Controllers.clear();
    world.free();
}

function getWorld(entity) {
    const sceneEntity = getAncestorWithComponent(entity, SceneComponent);
    if (!sceneEntity) return;
    const sceneUUID = getOptionalComponent(sceneEntity, UUIDComponent);
    if (!sceneUUID) return;
    return getState(RapierWorldState)[sceneUUID];
}

function useWorld(entity) {
    const sceneEntity = useAncestorWithComponent(entity, SceneComponent);
    const sceneUUID = useOptionalComponent(sceneEntity, UUIDComponent)?.value;
    const worlds = useHookstate(getMutableState(RapierWorldState));
    return sceneUUID ? worlds[sceneUUID].get(NO_PROXY) : undefined;
}

function smoothKinematicBody(physicsWorld, entity, dt, substep) {
    const rigidbodyComponent = getComponent(entity, RigidBodyComponent);
    if (rigidbodyComponent.targetKinematicLerpMultiplier === 0) {
        /** deterministic linear interpolation between substeps */
        rigidbodyComponent.position.lerpVectors(
            rigidbodyComponent.previousPosition,
            rigidbodyComponent.targetKinematicPosition,
            substep,
        );
        rigidbodyComponent.rotation
            .copy(rigidbodyComponent.previousRotation)
            .fastSlerp(rigidbodyComponent.targetKinematicRotation, substep);
    } else {
        /** gradual smoothing between substeps */
        const alpha = smootheLerpAlpha(rigidbodyComponent.targetKinematicLerpMultiplier, dt);
        rigidbodyComponent.position.lerp(rigidbodyComponent.targetKinematicPosition, alpha);
        rigidbodyComponent.rotation.fastSlerp(rigidbodyComponent.targetKinematicRotation, alpha);
    }
    Physics.setKinematicRigidbodyPose(
        physicsWorld,
        entity,
        rigidbodyComponent.position,
        rigidbodyComponent.rotation,
    );
}

function simulate(simulationTimestep, kinematicEntities) {
    const physicsWorlds = Object.values(getState(RapierWorldState));

    for (const world of physicsWorlds) {
        const { substeps, drainCollisions, drainContacts, collisionEventQueue } = world;

        // step physics world
        const timestep = simulationTimestep / 1000 / substeps;
        world.timestep = timestep;
        // const smoothnessMultiplier = 50
        // const smoothAlpha = smoothnessMultiplier * timestep
        for (let i = 0; i < substeps; i++) {
            // smooth kinematic pose changes
            const substep = (i + 1) / substeps;
            for (const entity of kinematicEntities) {
                if (world.Rigidbodies.has(entity))
                    smoothKinematicBody(world, entity, timestep, substep);
            }
            world.step(collisionEventQueue);
            collisionEventQueue.drainCollisionEvents(drainCollisions);
            collisionEventQueue.drainContactForceEvents(drainContacts);
        }
    }
}

function createCollisionEventQueue() {
    return new EventQueue(true);
}

const position = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3();
const mat4 = new Matrix4();

function createRigidBody(world, entity) {
    computeTransformMatrix(entity);
    TransformComponent.getMatrixRelativeToScene(entity, mat4);
    mat4.decompose(position, rotation, scale);

    TransformComponent.dirtyTransforms[entity] = false;

    const rigidBody = getComponent(entity, RigidBodyComponent);

    let rigidBodyDesc = undefined;
    switch (rigidBody.type) {
        case "fixed":
        default:
            rigidBodyDesc = RigidBodyDesc.fixed();
            break;

        case "dynamic":
            rigidBodyDesc = RigidBodyDesc.dynamic();
            break;

        case "kinematic":
            rigidBodyDesc = RigidBodyDesc.kinematicPositionBased();
            break;
    }
    rigidBodyDesc.translation = position;
    rigidBodyDesc.rotation = rotation;
    rigidBodyDesc.setCanSleep(rigidBody.canSleep);
    rigidBodyDesc.setGravityScale(rigidBody.gravityScale);

    const body = world.createRigidBody(rigidBodyDesc);
    body.setTranslation(position, false);
    body.setRotation(rotation, false);
    body.setLinvel(Vector3_Zero, false);
    body.setAngvel(Vector3_Zero, false);

    rigidBody.previousPosition.copy(position);
    rigidBody.previousRotation.copy(rotation);
    rigidBody.targetKinematicPosition.copy(position);
    rigidBody.targetKinematicRotation.copy(rotation);
    rigidBody.position.copy(position);
    rigidBody.rotation.copy(rotation);
    rigidBody.linearVelocity.copy(Vector3_Zero);
    rigidBody.angularVelocity.copy(Vector3_Zero);

    // set entity in userdata for fast look up when required.
    const rigidBodyUserdata = { entity: entity };
    body.userData = rigidBodyUserdata;

    world.Rigidbodies.set(entity, body);
}

function isSleeping(world, entity) {
    const rigidBody = world.Rigidbodies.get(entity);
    return !rigidBody || rigidBody.isSleeping();
}

const setRigidBodyType = (world, entity, type) => {
    const rigidbody = world.Rigidbodies.get(entity);
    if (!rigidbody) return;

    let typeEnum = undefined;
    switch (type) {
        case BodyTypes.Fixed:
        default:
            typeEnum = RigidBodyType.Fixed;
            break;

        case BodyTypes.Dynamic:
            typeEnum = RigidBodyType.Dynamic;
            break;

        case BodyTypes.Kinematic:
            typeEnum = RigidBodyType.KinematicPositionBased;
            break;
    }

    rigidbody.setBodyType(typeEnum, false);
};

function setRigidbodyPose(world, entity, position, rotation, linearVelocity, angularVelocity) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    rigidBody.setTranslation(position, false);
    rigidBody.setRotation(rotation, false);
    rigidBody.setLinvel(linearVelocity, false);
    rigidBody.setAngvel(angularVelocity, false);
}

function setKinematicRigidbodyPose(world, entity, position, rotation) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    rigidBody.setNextKinematicTranslation(position);
    rigidBody.setNextKinematicRotation(rotation);
}

function enabledCcd(world, entity, enabled) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    rigidBody.enableCcd(enabled);
}

/**
 * @note `lockRotations(entity, true)` is the exact same as `setEnabledRotations(entity, [ true, true, true ])`
 * @warning
 * Does not unlock in current version (0.11.2). Fixed in 0.12
 * https://github.com/dimforge/rapier.js/issues/282#issuecomment-2177426589
 */
function lockRotations(world, entity, lock) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    rigidBody.lockRotations(lock, false);
}

/**
 * @note `setEnabledRotations(entity, [ true, true, true ])` is the exact same as `lockRotations(entity, true)`
 */
function setEnabledRotations(world, entity, enabledRotations) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    rigidBody.setEnabledRotations(
        enabledRotations[0],
        enabledRotations[1],
        enabledRotations[2],
        false,
    );
}

function updatePreviousRigidbodyPose(entities) {
    for (const entity of entities) {
        const world = getWorld(entity);
        if (!world) continue;
        const body = world.Rigidbodies.get(entity);
        if (!body) continue;
        const translation = body.translation();
        const rotation = body.rotation();
        RigidBodyComponent.previousPosition.x[entity] = translation.x;
        RigidBodyComponent.previousPosition.y[entity] = translation.y;
        RigidBodyComponent.previousPosition.z[entity] = translation.z;
        RigidBodyComponent.previousRotation.x[entity] = rotation.x;
        RigidBodyComponent.previousRotation.y[entity] = rotation.y;
        RigidBodyComponent.previousRotation.z[entity] = rotation.z;
        RigidBodyComponent.previousRotation.w[entity] = rotation.w;
    }
}

function updateRigidbodyPose(entities) {
    for (const entity of entities) {
        const world = getWorld(entity);
        if (!world) continue;
        const body = world.Rigidbodies.get(entity);
        if (!body) continue;
        const translation = body.translation();
        const rotation = body.rotation();
        const linvel = body.linvel();
        const angvel = body.angvel();
        RigidBodyComponent.position.x[entity] = translation.x;
        RigidBodyComponent.position.y[entity] = translation.y;
        RigidBodyComponent.position.z[entity] = translation.z;
        RigidBodyComponent.rotation.x[entity] = rotation.x;
        RigidBodyComponent.rotation.y[entity] = rotation.y;
        RigidBodyComponent.rotation.z[entity] = rotation.z;
        RigidBodyComponent.rotation.w[entity] = rotation.w;
        RigidBodyComponent.linearVelocity.x[entity] = linvel.x;
        RigidBodyComponent.linearVelocity.y[entity] = linvel.y;
        RigidBodyComponent.linearVelocity.z[entity] = linvel.z;
        RigidBodyComponent.angularVelocity.x[entity] = angvel.x;
        RigidBodyComponent.angularVelocity.y[entity] = angvel.y;
        RigidBodyComponent.angularVelocity.z[entity] = angvel.z;
    }
}

function removeRigidbody(world, entity) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (rigidBody && world.bodies.contains(rigidBody.handle)) {
        world.removeRigidBody(rigidBody);
        world.Rigidbodies.delete(entity);
    }
}

function applyImpulse(world, entity, impulse) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    rigidBody.applyImpulse(impulse, true);
}

function createColliderDesc(world, entity, rootEntity) {
    if (!world.Rigidbodies.has(rootEntity)) return;

    const mesh = getOptionalComponent(entity, MeshComponent);

    const colliderComponent = getComponent(entity, ColliderComponent);

    let shape;

    switch (colliderComponent.shape) {
        case Shapes.Sphere:
            shape = ShapeType.Ball;
            break;
        case Shapes.Box: /*fall-through*/
        case Shapes.Plane:
            shape = ShapeType.Cuboid;
            break;
        case Shapes.Mesh:
            shape = ShapeType.TriMesh;
            break;
        case Shapes.ConvexHull:
            shape = ShapeType.ConvexPolyhedron;
            break;
        case Shapes.Capsule:
            shape = ShapeType.Capsule;
            break;
        case Shapes.Cylinder:
            shape = ShapeType.Cylinder;
            break;
        default:
            throw new Error("unrecognized collider shape type: " + colliderComponent.shape);
    }

    const scale = TransformComponent.getSceneScale(entity, new Vector3());

    let colliderDesc;

    switch (shape) {
        case ShapeType.Cuboid:
            if (colliderComponent.shape === "plane")
                colliderDesc = ColliderDesc.cuboid(10000, 0.001, 10000);
            else {
                if (mesh) {
                    // if we have a mesh, we want to make sure it uses the geometry itself to calculate the size
                    const _buff = mesh.geometry.clone();
                    const box = new Box3().setFromBufferAttribute(_buff.attributes.position);
                    const size = new Vector3();
                    box.getSize(size);
                    size.multiply(scale).multiplyScalar(0.5);
                    colliderDesc = ColliderDesc.cuboid(
                        Math.abs(size.x),
                        Math.abs(size.y),
                        Math.abs(size.z),
                    );
                } else {
                    colliderDesc = ColliderDesc.cuboid(
                        Math.abs(scale.x * 0.5),
                        Math.abs(scale.y * 0.5),
                        Math.abs(scale.z * 0.5),
                    );
                }
            }
            break;

        case ShapeType.Ball:
            colliderDesc = ColliderDesc.ball(Math.abs(scale.x));
            break;

        case ShapeType.Capsule:
            colliderDesc = ColliderDesc.capsule(Math.abs(scale.y), Math.abs(scale.x));
            break;

        case ShapeType.Cylinder:
            colliderDesc = ColliderDesc.cylinder(Math.abs(scale.y), Math.abs(scale.x));
            break;

        case ShapeType.ConvexPolyhedron: {
            if (!mesh?.geometry)
                return console.warn(
                    "[Physics]: Tried to load convex mesh but did not find a geometry",
                    mesh,
                );
            try {
                const _buff = mesh.geometry.clone().scale(scale.x, scale.y, scale.z);
                const vertices = new Float32Array(_buff.attributes.position.array);
                const indices = new Uint32Array(_buff.index.array);
                colliderDesc = ColliderDesc.convexMesh(vertices, indices);
            } catch (e) {
                console.log("Failed to construct collider from trimesh geometry", mesh.geometry, e);
                return;
            }
            break;
        }

        case ShapeType.TriMesh: {
            if (!mesh?.geometry)
                return console.warn(
                    "[Physics]: Tried to load tri mesh but did not find a geometry",
                    mesh,
                );
            try {
                const _buff = mesh.geometry
                    .clone()
                    .scale(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
                const vertices = new Float32Array(_buff.attributes.position.array);
                const indices = new Uint32Array(_buff.index.array);
                colliderDesc = ColliderDesc.trimesh(vertices, indices);
            } catch (e) {
                console.log("Failed to construct collider from trimesh geometry", mesh.geometry, e);
                return;
            }
            break;
        }

        default:
            console.error("unknown shape", colliderComponent);
            return;
    }

    const positionRelativeToRoot = new Vector3();
    const quaternionRelativeToRoot = new Quaternion();

    // get matrix relative to root
    if (rootEntity !== entity) {
        const matrixRelativeToRoot = new Matrix4();
        TransformComponent.getMatrixRelativeToEntity(entity, rootEntity, matrixRelativeToRoot);
        matrixRelativeToRoot.decompose(
            positionRelativeToRoot,
            quaternionRelativeToRoot,
            new Vector3(),
        );
    }

    const rootWorldScale = TransformComponent.getWorldScale(rootEntity, new Vector3());
    positionRelativeToRoot.multiply(rootWorldScale);

    colliderDesc.setFriction(colliderComponent.friction);
    colliderDesc.setRestitution(colliderComponent.restitution);

    const collisionLayer = colliderComponent.collisionLayer;
    const collisionMask = colliderComponent.collisionMask;
    colliderDesc.setCollisionGroups(getInteractionGroups(collisionLayer, collisionMask));

    colliderDesc.setTranslation(
        positionRelativeToRoot.x,
        positionRelativeToRoot.y,
        positionRelativeToRoot.z,
    );
    colliderDesc.setRotation(quaternionRelativeToRoot);

    colliderDesc.setSensor(hasComponent(entity, TriggerComponent));

    // TODO expose these
    colliderDesc.setActiveCollisionTypes(ActiveCollisionTypes.ALL);
    colliderDesc.setActiveEvents(ActiveEvents.COLLISION_EVENTS);

    return colliderDesc;
}

function attachCollider(world, colliderDesc, rigidBodyEntity, colliderEntity) {
    if (world.Colliders.has(colliderEntity)) return;
    const rigidBody = world.Rigidbodies.get(rigidBodyEntity); // guaranteed will exist
    if (!rigidBody) return console.error("Rigidbody not found for entity " + rigidBodyEntity);
    const collider = world.createCollider(colliderDesc, rigidBody);
    world.Colliders.set(colliderEntity, collider);
    return collider;
}

function setColliderPose(world, entity, position, rotation) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    collider.setTranslationWrtParent(position);
    collider.setRotationWrtParent(rotation);
}

function removeCollider(world, entity) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    world.removeCollider(collider, false);
    world.Colliders.delete(entity);
}

function setTrigger(world, entity, isTrigger) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    collider.setSensor(isTrigger);
    const colliderComponent = getComponent(entity, ColliderComponent);
    // if we are a trigger, we need to update the interaction bits of the collision groups to include the trigger group
    const collisionLayer = isTrigger ? CollisionGroups.Trigger : colliderComponent.collisionLayer;
    collider.setCollisionGroups(
        getInteractionGroups(collisionLayer, colliderComponent.collisionMask),
    );
}

function setFriction(world, entity, friction) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    collider.setFriction(friction);
}

function setRestitution(world, entity, restitution) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    collider.setRestitution(restitution);
}

function setMass(world, entity, mass) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    collider.setMass(mass);
}

function setMassCenter(world, entity, massCenter) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    collider.setMassProperties(massCenter, collider.mass());
}

function setCollisionLayer(world, entity, collisionLayer) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    const colliderComponent = getComponent(entity, ColliderComponent);
    const _collisionLayer = hasComponent(entity, TriggerComponent)
        ? collisionLayer | ~CollisionGroups.Trigger
        : collisionLayer;
    collider.setCollisionGroups(
        getInteractionGroups(_collisionLayer, colliderComponent.collisionMask),
    );
}

function setCollisionMask(world, entity, collisionMask) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    const colliderComponent = getComponent(entity, ColliderComponent);
    const collisionLayer = hasComponent(entity, TriggerComponent)
        ? colliderComponent.collisionLayer | ~CollisionGroups.Trigger
        : colliderComponent.collisionLayer;
    collider.setCollisionGroups(getInteractionGroups(collisionLayer, collisionMask));
}

function getShape(world, entity) {
    const collider = world.Colliders.get(entity);
    if (!collider) return;
    return RapierShapeToString[collider.shape.type];
}

function removeCollidersFromRigidBody(entity, world) {
    const rigidBody = world.Rigidbodies.get(entity);
    if (!rigidBody) return;
    const numColliders = rigidBody.numColliders();
    for (let index = 0; index < numColliders; index++) {
        const collider = rigidBody.collider(index);
        world.removeCollider(collider, false);
    }
}

function createCharacterController(
    world,
    entity,
    {
        offset = 0.01,
        maxSlopeClimbAngle = (60 * Math.PI) / 180,
        minSlopeSlideAngle = (30 * Math.PI) / 180,
        autoStep = { maxHeight: 0.5, minWidth: 0.01, stepOverDynamic: true },
        enableSnapToGround = 0.1 | false,
    },
) {
    const characterController = world.createCharacterController(offset);
    characterController.setMaxSlopeClimbAngle(maxSlopeClimbAngle);
    characterController.setMinSlopeSlideAngle(minSlopeSlideAngle);
    if (autoStep)
        characterController.enableAutostep(
            autoStep.maxHeight,
            autoStep.minWidth,
            autoStep.stepOverDynamic,
        );
    if (enableSnapToGround) characterController.enableSnapToGround(enableSnapToGround);
    else characterController.disableSnapToGround();
    world.Controllers.set(entity, characterController);
}

function removeCharacterController(world, entity) {
    const controller = world.Controllers.get(entity);
    if (!controller) return;
    world.removeCharacterController(controller);
    world.Controllers.delete(entity);
}

/**
 * @deprecated - will be populated on AvatarControllerComponent
 */
function getControllerOffset(world, entity) {
    const controller = world.Controllers.get(entity);
    if (!controller) return 0;
    return controller.offset();
}

const controllerMoveFilterFlags = QueryFilterFlags.EXCLUDE_SENSORS;

function computeColliderMovement(
    world,
    entity,
    colliderEntity,
    desiredTranslation,
    filterGroups,
    filterPredicate,
) {
    const controller = world.Controllers.get(entity);
    if (!controller) return;
    const collider = world.Colliders.get(colliderEntity);
    if (!collider) return;
    controller.computeColliderMovement(
        collider,
        desiredTranslation,
        controllerMoveFilterFlags,
        filterGroups,
        filterPredicate,
    );
}

function getComputedMovement(world, entity, out) {
    const controller = world.Controllers.get(entity);
    if (!controller) return out.set(0, 0, 0);
    return out.copy(controller.computedMovement());
}

const _worldInverseMatrix = new Matrix4();
const _origin = new Vector3();
const _direction = new Vector3();
const _quaternion = new Quaternion();
const _vector3 = new Vector3();
/**
 * Raycast from a world position and direction
 */
function castRay(world, raycastQuery, filterPredicate) {
    const worldEntity = UUIDComponent.getEntityByUUID(world.id);
    const worldTransform = getComponent(worldEntity, TransformComponent);
    _worldInverseMatrix.copy(worldTransform.matrixWorld).invert();

    const ray = new Ray(
        _origin.copy(raycastQuery.origin).applyMatrix4(_worldInverseMatrix),
        _direction
            .copy(raycastQuery.direction)
            .applyQuaternion(_quaternion.copy(worldTransform.rotation).invert())
            .multiply(
                _vector3.set(
                    1 / worldTransform.scale.x,
                    1 / worldTransform.scale.y,
                    1 / worldTransform.scale.z,
                ),
            ),
    );
    const maxToi = raycastQuery.maxDistance;
    const solid = true; // TODO: Add option for this in args
    const groups = raycastQuery.groups;
    const flags = raycastQuery.flags;

    const excludeCollider =
        raycastQuery.excludeCollider && world.Colliders.get(raycastQuery.excludeCollider);
    const excludeRigidBody =
        raycastQuery.excludeRigidBody && world.Rigidbodies.get(raycastQuery.excludeRigidBody);

    const hits = [];
    const hitWithNormal = world.castRayAndGetNormal(
        ray,
        maxToi,
        solid,
        flags,
        groups,
        excludeCollider,
        excludeRigidBody,
        filterPredicate,
    );
    if (hitWithNormal?.collider) {
        const body = hitWithNormal.collider.parent();
        if (!body) {
            //console.warn('No rigid body found for collider', hitWithNormal.collider)
        } else
            hits.push({
                collider: hitWithNormal.collider,
                distance: hitWithNormal.toi,
                position: ray.pointAt(hitWithNormal.toi),
                normal: hitWithNormal.normal,
                body,
                entity: body.userData["entity"],
            });
    }

    return hits;
}

const _perspectiveCamera = new PerspectiveCamera();
const _orthographicCamera = new OrthographicCamera();

function castRayFromCamera(world, camera, coords, raycastQuery, filterPredicate) {
    const worldEntity = UUIDComponent.getEntityByUUID(world.id);
    const worldTransform = getComponent(worldEntity, TransformComponent);

    if (camera.isPerspectiveCamera) {
        _perspectiveCamera.copy(camera);
        _perspectiveCamera.updateProjectionMatrix();
        _perspectiveCamera.matrixWorld
            .copy(worldTransform.matrixWorld)
            .invert()
            .multiply(camera.matrixWorld);
        raycastQuery.origin.setFromMatrixPosition(_perspectiveCamera.matrixWorld);
        raycastQuery.direction
            .set(coords.x, coords.y, 0.5)
            .unproject(_perspectiveCamera)
            .sub(raycastQuery.origin)
            .normalize();
    } else if (camera.isOrthographicCamera) {
        _orthographicCamera.copy(camera);
        _orthographicCamera.updateProjectionMatrix();
        _orthographicCamera.matrixWorld
            .copy(worldTransform.matrixWorld)
            .invert()
            .multiply(camera.matrixWorld);
        raycastQuery.origin
            .set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
            .unproject(_orthographicCamera);
        raycastQuery.direction.set(0, 0, -1).transformDirection(_orthographicCamera.matrixWorld);
    }
    return Physics.castRay(world, raycastQuery, filterPredicate);
}

function castShape(world, shapecastQuery) {
    const maxToi = shapecastQuery.maxDistance;
    const groups = shapecastQuery.collisionGroups;
    const collider = shapecastQuery.collider;

    shapecastQuery.hits = [];
    const hitWithNormal = world.castShape(
        collider.translation(),
        collider.rotation(),
        shapecastQuery.direction,
        collider.shape,
        maxToi,
        true,
        groups,
    );
    if (hitWithNormal != null) {
        shapecastQuery.hits.push({
            distance: hitWithNormal.toi,
            position: hitWithNormal.witness1,
            normal: hitWithNormal.normal1,
            collider: hitWithNormal.collider,
            body: hitWithNormal.collider.parent(),
            entity: (hitWithNormal.collider.parent()?.userData)["entity"] ?? UndefinedEntity,
        });
    }
}

const drainCollisionEventQueue = physicsWorld => (handle1, handle2, started) => {
    const collider1 = physicsWorld.getCollider(handle1);
    const collider2 = physicsWorld.getCollider(handle2);
    if (!collider1 || !collider2) return;

    const isTriggerEvent = collider1.isSensor() || collider2.isSensor();
    const rigidBody1 = collider1.parent();
    const rigidBody2 = collider2.parent();
    const entity1 = (rigidBody1?.userData)["entity"];
    const entity2 = (rigidBody2?.userData)["entity"];

    setComponent(entity1, CollisionComponent);
    setComponent(entity2, CollisionComponent);

    const collisionComponent1 = getComponent(entity1, CollisionComponent);
    const collisionComponent2 = getComponent(entity2, CollisionComponent);

    if (started) {
        const type = isTriggerEvent
            ? CollisionEvents.TRIGGER_START
            : CollisionEvents.COLLISION_START;
        collisionComponent1?.set(entity2, {
            type,
            bodySelf: rigidBody1,
            bodyOther: rigidBody2,
            shapeSelf: collider1,
            shapeOther: collider2,
            maxForceDirection,
            totalForce,
        });
        collisionComponent2?.set(entity1, {
            type,
            bodySelf: rigidBody2,
            bodyOther: rigidBody1,
            shapeSelf: collider2,
            shapeOther: collider1,
            maxForceDirection,
            totalForce,
        });
    } else {
        const type = isTriggerEvent ? CollisionEvents.TRIGGER_END : CollisionEvents.COLLISION_END;
        if (collisionComponent1?.has(entity2)) collisionComponent1.get(entity2).type = type;
        if (collisionComponent2?.has(entity1)) collisionComponent2.get(entity1).type = type;
    }
};

const drainContactEventQueue = physicsWorld => event => {
    const collider1 = physicsWorld.getCollider(event.collider1());
    const collider2 = physicsWorld.getCollider(event.collider2());

    const rigidBody1 = collider1.parent();
    const rigidBody2 = collider2.parent();
    const entity1 = (rigidBody1?.userData)["entity"];
    const entity2 = (rigidBody2?.userData)["entity"];

    const collisionComponent1 = getOptionalComponent(entity1, CollisionComponent);
    const collisionComponent2 = getOptionalComponent(entity2, CollisionComponent);

    const collision1 = collisionComponent1?.get(entity2);
    const collision2 = collisionComponent2?.get(entity1);

    const maxForceDirection = event.maxForceDirection();
    const totalForce = event.totalForce();

    if (collision1) {
        collision1.maxForceDirection = maxForceDirection;
        collision1.totalForce = totalForce;
    }

    if (collision2) {
        collision2.maxForceDirection = maxForceDirection;
        collision2.totalForce = totalForce;
    }
};

export const Physics = {
    load,
    createWorld,
    destroyWorld,
    getWorld,
    useWorld,
    smoothKinematicBody,
    simulate,
    /** world.Rigidbodies */
    createRigidBody,
    removeRigidbody,
    isSleeping,
    setRigidBodyType,
    setRigidbodyPose,
    enabledCcd,
    lockRotations,
    setEnabledRotations,
    updatePreviousRigidbodyPose,
    updateRigidbodyPose,
    setKinematicRigidbodyPose,
    applyImpulse,
    /** Colliders */
    createColliderDesc,
    attachCollider,
    setColliderPose,
    setTrigger,
    setFriction,
    setRestitution,
    setMass,
    setMassCenter,
    setCollisionLayer,
    setCollisionMask,
    getShape,
    removeCollider,
    removeCollidersFromRigidBody,
    /** Charcter Controller */
    createCharacterController,
    removeCharacterController,
    computeColliderMovement,
    getComputedMovement,
    getControllerOffset,
    /** Raycasts */
    castRay,
    castRayFromCamera,
    castShape,
    /** Collisions */
    createCollisionEventQueue,
    drainCollisionEventQueue,
    drainContactEventQueue,
};

globalThis.Physics = Physics;
