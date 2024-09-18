import { Easing, Tween } from "@tweenjs/tween.js";
import { useEffect } from "react";
import {
    AdditiveBlending,
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Vector3,
} from "three";

import {
    defineComponent,
    getComponent,
    getMutableComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import { createEntity, removeEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import {
    ObjectDirection,
    Vector3_Right,
    Vector3_Up,
} from "../../../spatial/common/constants/MathConstants";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { Physics } from "../../../spatial/physics/classes/Physics";
import {
    AvatarCollisionMask,
    CollisionGroups,
} from "../../../spatial/physics/enums/CollisionGroups";
import { getInteractionGroups } from "../../../spatial/physics/functions/getInteractionGroups";
import { SceneQueryType } from "../../../spatial/physics/types/PhysicsTypes";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import {
    setVisibleComponent,
    VisibleComponent,
} from "../../../spatial/renderer/components/VisibleComponent";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { TweenComponent } from "../../../spatial/transform/components/TweenComponent";

export const SpawnEffectComponent = defineComponent({
    name: "SpawnEffectComponent",
    onInit: _entity => {
        return {
            sourceEntity: UndefinedEntity,
            opacityMultiplier: 1,
            plateEntity: UndefinedEntity,
            lightEntities: [],
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (json.sourceEntity) component.sourceEntity.set(json.sourceEntity);
        if (json.opacityMultiplier) component.opacityMultiplier.set(json.opacityMultiplier);
    },

    reactor: () => {
        const entity = useEntityContext();

        useEffect(() => {
            const effectComponent = getComponent(entity, SpawnEffectComponent);
            const sourceTransform = getComponent(effectComponent.sourceEntity, TransformComponent);
            /** Copy transform but do not attach to avatar */
            setComponent(entity, TransformComponent, {
                position: sourceTransform.position.clone(),
            });
            const transform = getComponent(entity, TransformComponent);
            setComponent(entity, VisibleComponent, true);
            /** cast ray to move this downward to be on the ground */
            downwardGroundRaycast.origin.copy(sourceTransform.position);
            const physicsWorld = Physics.getWorld(entity);
            const hits = Physics.castRay(physicsWorld, downwardGroundRaycast);
            if (hits.length) {
                transform.position.y = hits[0].position.y;
            }

            createPlateEntity(entity);
            createRayEntities(entity);

            SpawnEffectComponent.fadeIn(entity);

            return () => {
                removeEntity(effectComponent.plateEntity);
                for (const lightEntity of effectComponent.lightEntities) {
                    removeEntity(lightEntity);
                }
            };
        }, []);

        return null;
    },

    fadeIn: entity => {
        const effectComponent = getComponent(entity, SpawnEffectComponent);
        setComponent(
            entity,
            TweenComponent,
            new Tween() <
                any >
                effectComponent
                    .to(
                        {
                            opacityMultiplier: 1,
                        },
                        1000,
                    )
                    .easing(Easing.Exponential.Out)
                    .start()
                    .onComplete(() => {
                        removeComponent(entity, TweenComponent);
                    }),
        );
    },

    fadeOut: entity => {
        const effectComponent = getComponent(entity, SpawnEffectComponent);
        setComponent(
            entity,
            TweenComponent,
            new Tween() <
                any >
                effectComponent
                    .to(
                        {
                            opacityMultiplier: 0,
                        },
                        2000,
                    )
                    .start()
                    .onComplete(() => {
                        removeEntity(entity);
                    }),
        );
    },

    lightMesh: new Mesh(
        new PlaneGeometry(0.04, 3.2),
        new MeshBasicMaterial({
            transparent: true,
            blending: AdditiveBlending,
            depthWrite: false,
            side: DoubleSide,
        }),
    ),

    plateMesh: new Mesh(
        new PlaneGeometry(1.6, 1.6),
        new MeshBasicMaterial({
            transparent: false,
            blending: AdditiveBlending,
            depthWrite: false,
        }),
    ),
});

const createPlateEntity = entity => {
    const plateMesh = new Mesh(
        SpawnEffectComponent.plateMesh.geometry,
        SpawnEffectComponent.plateMesh.material,
    );
    const plateEntity = createEntity();
    setComponent(plateEntity, NameComponent, "Spawn Plate " + entity);
    setComponent(plateEntity, EntityTreeComponent, { parentEntity });
    addObjectToGroup(plateEntity, plateMesh);
    setVisibleComponent(plateEntity, true);
    const transform = getComponent(plateEntity, TransformComponent);
    transform.rotation.setFromAxisAngle(Vector3_Right, -0.5 * Math.PI);
    transform.position.y = 0.01;
    getMutableComponent(entity, SpawnEffectComponent).plateEntity.set(plateEntity);
};

const createRayEntities = entity => {
    const R = 0.6 * SpawnEffectComponent.plateMesh.geometry.boundingSphere.radius;
    const rayCount = 5 + 10 * R * Math.random();

    for (let i = 0; i < rayCount; i += 1) {
        const ray = SpawnEffectComponent.lightMesh.clone();

        const rayEntity = createEntity();
        setComponent(rayEntity, NameComponent, "Spawn Ray " + entity);
        setComponent(rayEntity, EntityTreeComponent, { parentEntity });
        addObjectToGroup(rayEntity, ray);
        const transform = getComponent(rayEntity, TransformComponent);
        setVisibleComponent(rayEntity, true);
        getMutableComponent(entity, SpawnEffectComponent).lightEntities.merge([rayEntity]);

        const a = (2 * Math.PI * i) / rayCount;
        const r = R * Math.random();
        transform.position.x += r * Math.cos(a);
        transform.position.y += 0.5 * ray.geometry.boundingSphere?.radius * Math.random();
        transform.position.z += r * Math.sin(a);

        transform.rotation.setFromAxisAngle(Vector3_Up, Math.random() * 2 * Math.PI);
    }
};

const downwardGroundRaycast = {
    type: SceneQueryType.Closest,
    origin: new Vector3(),
    direction: ObjectDirection.Down,
    maxDistance: 10,
    groups: getInteractionGroups(CollisionGroups.Avatars, AvatarCollisionMask),
};
