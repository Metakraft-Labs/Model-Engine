import { RigidBodyType, ShapeType } from "@dimforge/rapier3d-compat";
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

/** @deprecated - use the new API */
export const OldColliderComponent = defineComponent({
    name: "OldColliderComponent",
    jsonID: "collider",

    onInit(_entity) {
        return {
            bodyType: RigidBodyType.Fixed,
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
                    onEnter: null,
                    /**
                     * The function to call on the CallbackComponent of the targetEntity when the trigger volume is exited.
                     */
                    onExit: null,
                    /**
                     * uuid (null as null | string)
                     *
                     * empty string represents self
                     *
                     * TODO: how do we handle non-scene entities?
                     */
                    target: null,
                },
            ],
        };
    },

    onSet(_entity, component, json) {
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
                    if (!mesh) return; // || ((mesh?.geometry.attributes['position'] as BufferAttribute).array.length ?? 0 === 0)) return
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
