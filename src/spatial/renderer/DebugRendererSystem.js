import React, { useEffect } from "react";
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments } from "three";

import { getMutableState, getState, useMutableState } from "../../../hyperflux";
import { QueryReactor, UUIDComponent } from "../../ecs";
import { getComponent, setComponent, useComponent } from "../../ecs/ComponentFunctions";
import { createEntity, removeEntity, useEntityContext } from "../../ecs/EntityFunctions";
import { defineSystem } from "../ecs/SystemFunctions";

import { NameComponent } from "../common/NameComponent";
import { EngineState } from "../EngineState";
import { RapierWorldState } from "../physics/classes/Physics";
import { addObjectToGroup, GroupComponent } from "../renderer/components/GroupComponent";
import { setObjectLayers } from "../renderer/components/ObjectLayerComponent";
import { setVisibleComponent } from "../renderer/components/VisibleComponent";
import { ObjectLayers } from "../renderer/constants/ObjectLayers";
import { RendererState } from "../renderer/RendererState";
import { EntityTreeComponent } from "../transform/components/EntityTree";
import { createInfiniteGridHelper } from "./components/InfiniteGridHelper";
import { SceneComponent } from "./components/SceneComponents";

const PhysicsDebugEntities = new Map();

const execute = () => {
    for (const [id, physicsDebugEntity] of Array.from(PhysicsDebugEntities)) {
        const world = getState(RapierWorldState)[id];
        if (!world) continue;
        const lineSegments = getComponent(physicsDebugEntity, GroupComponent)[0];
        const debugRenderBuffer = world.debugRender();
        lineSegments.geometry.setAttribute(
            "position",
            new BufferAttribute(debugRenderBuffer.vertices, 3),
        );
        lineSegments.geometry.setAttribute(
            "color",
            new BufferAttribute(debugRenderBuffer.colors, 4),
        );
    }
};

const PhysicsReactor = () => {
    const entity = useEntityContext();
    const uuid = useComponent(entity, UUIDComponent).value;
    const engineRendererSettings = useMutableState(RendererState);

    useEffect(() => {
        /** @todo move physics debug to physics module */
        if (!engineRendererSettings.physicsDebug.value) return;

        const lineMaterial = new LineBasicMaterial({ vertexColors: true });
        const lineSegments = new LineSegments(new BufferGeometry(), lineMaterial);
        lineSegments.frustumCulled = false;

        const lineSegmentsEntity = createEntity();
        setComponent(lineSegmentsEntity, NameComponent, "Physics Debug");
        setVisibleComponent(lineSegmentsEntity, true);
        addObjectToGroup(lineSegmentsEntity, lineSegments);

        setComponent(lineSegmentsEntity, EntityTreeComponent, { parentEntity: entity });

        setObjectLayers(lineSegments, ObjectLayers.PhysicsHelper);
        PhysicsDebugEntities.set(uuid, lineSegmentsEntity);

        return () => {
            removeEntity(lineSegmentsEntity);
            PhysicsDebugEntities.delete(uuid);
        };
    }, [engineRendererSettings.physicsDebug, uuid]);

    return null;
};

const reactor = () => {
    const engineRendererSettings = useMutableState(RendererState);
    const originEntity = useMutableState(EngineState).originEntity.value;

    useEffect(() => {
        if (!engineRendererSettings.gridVisibility.value || !originEntity) return;

        const infiniteGridHelperEntity = createInfiniteGridHelper();
        setComponent(infiniteGridHelperEntity, EntityTreeComponent, { parentEntity: originEntity });
        getMutableState(RendererState).infiniteGridHelperEntity.set(infiniteGridHelperEntity);
        return () => {
            removeEntity(infiniteGridHelperEntity);
            getMutableState(RendererState).infiniteGridHelperEntity.set(null);
        };
    }, [originEntity, engineRendererSettings.gridVisibility]);

    return (
        <>
            <QueryReactor Components={[SceneComponent]} ChildEntityReactor={PhysicsReactor} />
        </>
    );
};

export const DebugRendererSystem = defineSystem({
    uuid: "ee.engine.DebugRendererSystem",
    insert: { beforeSystem },
    execute,
    reactor,
});
