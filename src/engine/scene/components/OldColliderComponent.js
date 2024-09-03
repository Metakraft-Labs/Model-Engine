import { ShapeType } from "@dimforge/rapier3d-compat";
import { useLayoutEffect } from "react";
import matches from "ts-matches";

import {
    defineComponent,
    getComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { NO_PROXY } from "../../../hyperflux";
import { InputComponent } from "../../../spatial/input/components/InputComponent";
import { ColliderComponent as NewColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../spatial/physics/components/RigidBodyComponent";
import { TriggerComponent } from "../../../spatial/physics/components/TriggerComponent";
import {
    CollisionGroups,
    DefaultCollisionMask,
} from "../../../spatial/physics/enums/CollisionGroups";
import { BodyTypes, OldShapeTypes } from "../../../spatial/physics/types/PhysicsTypes";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { iterateEntityNode, useTreeQuery } from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import {
    computeTransformMatrix,
    updateGroupChildren,
} from "../../../spatial/transform/systems/TransformSystem";

import { GLTFLoadedComponent } from "./GLTFLoadedComponent";

export const RigidBodyType = {
    Dynamic: 0,
    /**
     * A `RigidBodyType::Fixed` body cannot be affected by external forces.
     */
    Fixed: 1,
    /**
     * A `RigidBodyType::KinematicPositionBased` body cannot be affected by any external forces but can be controlled
     * by the user at the position level while keeping realistic one-way interaction with dynamic bodies.
     *
     * One-way interaction means that a kinematic body can push a dynamic body, but a kinematic body
     * cannot be pushed by anything. In other words, the trajectory of a kinematic body can only be
     * modified by the user and is independent from any contact or joint it is involved in.
     */
    KinematicPositionBased: 2,
    /**
     * A `RigidBodyType::KinematicVelocityBased` body cannot be affected by any external forces but can be controlled
     * by the user at the velocity level while keeping realistic one-way interaction with dynamic bodies.
     *
     * One-way interaction means that a kinematic body can push a dynamic body, but a kinematic body
     * cannot be pushed by anything. In other words, the trajectory of a kinematic body can only be
     * modified by the user and is independent from any contact or joint it is involved in.
     */
    KinematicVelocityBased: 3,
};

export const ShapeType = {
    Ball: 0,
    Cuboid: 1,
    Capsule: 2,
    Segment: 3,
    Polyline: 4,
    Triangle: 5,
    TriMesh: 6,
    HeightField: 7,
    ConvexPolyhedron: 9,
    Cylinder: 10,
    Cone: 11,
    RoundCuboid: 12,
    RoundTriangle: 13,
    RoundCylinder: 14,
    RoundCone: 15,
    RoundConvexPolyhedron: 16,
    HalfSpace: 17,
};

/** @deprecated - use the new API */
export const OldColliderComponent = defineComponent({
    name: "OldColliderComponent",
    jsonID: "collider",

    onInit(entity) {
        return {
            bodyType: 1,
            shapeType: ShapeType.Cuboid,
            isTrigger: false,
            /**
             * removeMesh will clean up any objects in the scene hierarchy after the collider bodies have been processed.
             *   This can be used to reduce CPU load by only persisting colliders in the physics simulation.
             */
            removeMesh: false,
            collisionLayer: CollisionGroups.Default,
            collisionMask: DefaultCollisionMask,
            restitution: 0.5,
            triggers: [
                {
                    /**
                     * The function to call on the CallbackComponent of the targetEntity when the trigger volume is entered.
                     */
                    onEnter,
                    /**
                     * The function to call on the CallbackComponent of the targetEntity when the trigger volume is exited.
                     */
                    onExit,
                    /**
                     * uuid (null  )
                     *
                     * empty string represents self
                     *
                     * TODO: how do we handle non-scene entities?
                     */
                    target,
                },
            ],
        };
    },

    onSet(entity, component, json) {
        if (!json) return;

        if (typeof json.bodyType === "number") component.bodyType.set(json.bodyType);
        if (typeof json.shapeType === "number") component.shapeType.set(json.shapeType);
        if (typeof json.isTrigger === "boolean" || typeof json.isTrigger === "number")
            component.isTrigger.set(Boolean(json.isTrigger));
        if (typeof json.removeMesh === "boolean" || typeof json.removeMesh === "number")
            component.removeMesh.set(Boolean(json.removeMesh));
        if (typeof json.collisionLayer === "number")
            component.collisionLayer.set(json.collisionLayer);
        if (typeof json.collisionMask === "number") component.collisionMask.set(json.collisionMask);
        if (typeof json.restitution === "number") component.restitution.set(json.restitution);

        // backwards compatibility
        const onEnter = json.onEnter ?? null;
        const onExit = json.onExit ?? null;
        const target = json.target ?? null;
        if (!!onEnter || !!onExit || !!target) {
            component.triggers.set([{ onEnter, onExit, target }]);
        } else if (typeof json.triggers === "object") {
            if (
                matches
                    .arrayOf(
                        matches.shape({
                            onEnter: matches.nill.orParser(matches.string),
                            onExit: matches.nill.orParser(matches.string),
                            target: matches.nill.orParser(matches.string),
                        }),
                    )
                    .test(json.triggers)
            ) {
                component.triggers.set(json.triggers);
            }
        }
    },

    toJSON(entity, component) {
        return {
            bodyType: component.bodyType.value,
            shapeType: component.shapeType.value,
            isTrigger: component.isTrigger.value,
            removeMesh: component.removeMesh.value,
            collisionLayer: component.collisionLayer.value,
            collisionMask: component.collisionMask.value,
            restitution: component.restitution.value,
            triggers: component.triggers.get(NO_PROXY),
        };
    },

    reactor: function () {
        const entity = useEntityContext();

        const transformComponent = useComponent(entity, TransformComponent);
        const colliderComponent = useComponent(entity, OldColliderComponent);
        const isLoadedFromGLTF = useOptionalComponent(entity, GLTFLoadedComponent);
        const groupComponent = useOptionalComponent(entity, GroupComponent);
        const tree = useTreeQuery(entity);

        useLayoutEffect(() => {
            setComponent(entity, InputComponent);

            const isMeshCollider = [ShapeType.TriMesh, ShapeType.ConvexPolyhedron].includes(
                colliderComponent.shapeType.value,
            );

            if (isLoadedFromGLTF?.value || isMeshCollider) {
                const colliderComponent = getComponent(entity, OldColliderComponent);

                iterateEntityNode(entity, computeTransformMatrix);
                if (hasComponent(entity, GroupComponent)) {
                    updateGroupChildren(entity);
                }

                const meshesToRemove = [];

                const colliderDescOptions = {
                    bodyType: colliderComponent.bodyType,
                    shapeType: colliderComponent.shapeType,
                    isTrigger: colliderComponent.isTrigger,
                    collisionLayer: colliderComponent.collisionLayer,
                    collisionMask: colliderComponent.collisionMask,
                    restitution: colliderComponent.restitution,
                };

                const rigidBodyType =
                    typeof colliderComponent.bodyType === "string"
                        ? RigidBodyType[colliderComponent.bodyType]
                        : colliderComponent.bodyType;

                let type;
                switch (rigidBodyType) {
                    default:
                    case RigidBodyType.Fixed:
                        type = BodyTypes.Fixed;
                        break;

                    case RigidBodyType.Dynamic:
                        type = BodyTypes.Dynamic;
                        break;

                    case RigidBodyType.KinematicPositionBased:
                    case RigidBodyType.KinematicVelocityBased:
                        type = BodyTypes.Kinematic;
                        break;
                }

                setComponent(entity, RigidBodyComponent, { type });

                iterateEntityNode(entity, child => {
                    const mesh = getOptionalComponent(child, MeshComponent);
                    if (!mesh) return; // || ((mesh?.geometry.attributes['position']).array.length ?? 0 === 0)) return
                    if (mesh.userData.type && mesh.userData.type !== "glb")
                        mesh.userData.shapeType = mesh.userData.type;

                    const args = { ...colliderDescOptions, ...mesh.userData };
                    if (args.shapeType) args.shape = OldShapeTypes[args.shapeType];
                    if (args.isTrigger) setComponent(child, TriggerComponent);
                    setComponent(child, NewColliderComponent, args);

                    meshesToRemove.push(mesh);
                });
            } else {
                /**
                 * If rigidbody does not exist, create one
                 */
                let type;
                switch (colliderComponent.bodyType.value) {
                    default:
                    case RigidBodyType.Fixed:
                        type = BodyTypes.Fixed;
                        break;
                    case RigidBodyType.Dynamic:
                        type = BodyTypes.Dynamic;
                        break;
                    case RigidBodyType.KinematicPositionBased:
                    case RigidBodyType.KinematicVelocityBased:
                        type = BodyTypes.Kinematic;
                        break;
                }
                setComponent(entity, RigidBodyComponent, { type });

                removeComponent(entity, NewColliderComponent);

                setComponent(entity, NewColliderComponent, {
                    shape: OldShapeTypes[colliderComponent.shapeType.value],
                    collisionLayer: colliderComponent.collisionLayer.value,
                    collisionMask: colliderComponent.collisionMask.value,
                    restitution: colliderComponent.restitution.value,
                });

                if (colliderComponent.isTrigger.value) {
                    setComponent(entity, TriggerComponent);
                } else {
                    removeComponent(entity, TriggerComponent);
                }
            }
        }, [isLoadedFromGLTF, colliderComponent, transformComponent, groupComponent?.length, tree]);

        return null;
    },
});
