import { Vector3 } from "three";

import {
    defineComponent,
    useComponent,
    useEntityContext,
    useOptionalComponent,
} from "../../../ecs";
import { useState } from "../../../hyperflux";

import { useLayoutEffect } from "react";
import { useAncestorWithComponent } from "../../transform/components/EntityTree";
import { TransformComponent } from "../../transform/components/TransformComponent";
import { Physics } from "../classes/Physics";
import { CollisionGroups, DefaultCollisionMask } from "../enums/CollisionGroups";
import { Shapes } from "../types/PhysicsTypes";
import { RigidBodyComponent } from "./RigidBodyComponent";
import { TriggerComponent } from "./TriggerComponent";

export const ColliderComponent = defineComponent({
    name: "ColliderComponent",
    jsonID: "EE_collider",

    onInit(_entity) {
        return {
            shape: "box",
            mass: 1,
            massCenter: new Vector3(),
            friction: 0.5,
            restitution: 0.5,
            collisionLayer: CollisionGroups.Default,
            collisionMask: DefaultCollisionMask,
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;

        if (typeof json.shape === "string") component.shape.set(json.shape);
        if (typeof json.mass === "number") component.mass.set(json.mass);
        if (typeof json.massCenter === "object")
            component.massCenter.set(
                new Vector3(json.massCenter.x, json.massCenter.y, json.massCenter.z),
            );
        if (typeof json.friction === "number") component.friction.set(json.friction);
        if (typeof json.restitution === "number") component.restitution.set(json.restitution);
        if (typeof json.collisionLayer === "number")
            component.collisionLayer.set(json.collisionLayer);
        if (typeof json.collisionMask === "number") component.collisionMask.set(json.collisionMask);
    },

    toJSON(entity, component) {
        return {
            shape: component.shape.value,
            mass: component.mass.value,
            massCenter: component.massCenter.value,
            friction: component.friction.value,
            restitution: component.restitution.value,
            collisionLayer: component.collisionLayer.value,
            collisionMask: component.collisionMask.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, ColliderComponent);
        const transform = useComponent(entity, TransformComponent);
        const rigidbodyEntity = useAncestorWithComponent(entity, RigidBodyComponent);
        const rigidbodyComponent = useOptionalComponent(rigidbodyEntity, RigidBodyComponent);
        const physicsWorld = Physics.useWorld(entity);
        const triggerComponent = useOptionalComponent(entity, TriggerComponent);
        const hasCollider = useState(false);

        useLayoutEffect(() => {
            if (!rigidbodyComponent?.initialized?.value || !physicsWorld) return;

            const colliderDesc = Physics.createColliderDesc(physicsWorld, entity, rigidbodyEntity);

            if (!colliderDesc) return;

            Physics.attachCollider(physicsWorld, colliderDesc, rigidbodyEntity, entity);
            hasCollider.set(true);

            return () => {
                Physics.removeCollider(physicsWorld, entity);
                hasCollider.set(false);
            };
        }, [
            physicsWorld,
            component.shape,
            !!rigidbodyComponent?.initialized?.value,
            transform.scale,
        ]);

        useLayoutEffect(() => {
            if (!physicsWorld) return;
            Physics.setMass(physicsWorld, entity, component.mass.value);
        }, [physicsWorld, component.mass]);

        // useLayoutEffect(() => {
        // @todo
        // }, [physicsWorld, component.massCenter])

        useLayoutEffect(() => {
            if (!physicsWorld) return;
            Physics.setFriction(physicsWorld, entity, component.friction.value);
        }, [physicsWorld, component.friction]);

        useLayoutEffect(() => {
            if (!physicsWorld) return;
            Physics.setRestitution(physicsWorld, entity, component.restitution.value);
        }, [physicsWorld, component.restitution]);

        useLayoutEffect(() => {
            if (!physicsWorld) return;
            Physics.setCollisionLayer(physicsWorld, entity, component.collisionLayer.value);
        }, [physicsWorld, component.collisionLayer]);

        useLayoutEffect(() => {
            if (!physicsWorld) return;
            Physics.setCollisionMask(physicsWorld, entity, component.collisionMask.value);
        }, [physicsWorld, component.collisionMask]);

        useLayoutEffect(() => {
            if (!physicsWorld || !triggerComponent?.value || !hasCollider.value) return;

            Physics.setTrigger(physicsWorld, entity, true);

            return () => {
                Physics.setTrigger(physicsWorld, entity, false);
            };
        }, [physicsWorld, triggerComponent, hasCollider]);

        return null;
    },
});

export const supportedColliderShapes = [
    Shapes.Sphere,
    Shapes.Capsule,
    Shapes.Cylinder,
    Shapes.Box,
    // Shapes.ConvexHull,
    Shapes.Mesh,
    // Shapes.Heightfield
];
