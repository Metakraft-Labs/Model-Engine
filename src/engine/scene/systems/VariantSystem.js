import { Not } from "bitecs";
import { useEffect } from "react";

import { PresentationSystemGroup } from "../../../ecs";
import { ECSState } from "../../../ecs/ECSState";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { getState, useMutableState } from "../../../hyperflux";
import { EngineState } from "../../../spatial/EngineState";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { PerformanceState } from "../../../spatial/renderer/PerformanceState";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { InstancingComponent } from "../components/InstancingComponent";
import { ModelComponent } from "../components/ModelComponent";
import { VariantComponent } from "../components/VariantComponent";
import {
    setInstancedMeshVariant,
    setMeshVariant,
    setModelVariant,
    setModelVariantLOD,
} from "../functions/loaders/VariantFunctions";

const updateFrequency = 0.1;
let lastUpdate = 0;

export const modelVariantQuery = defineQuery([
    VariantComponent,
    ModelComponent,
    TransformComponent,
]);
export const meshVariantQuery = defineQuery([
    VariantComponent,
    MeshComponent,
    TransformComponent,
    Not(InstancingComponent),
]);
export const instancedMeshVariantQuery = defineQuery([
    VariantComponent,
    MeshComponent,
    TransformComponent,
    InstancingComponent,
]);

function execute() {
    const engineState = getState(EngineState);
    if (engineState.isEditing) return;

    const ecsState = getState(ECSState);

    if (ecsState.elapsedSeconds - lastUpdate < updateFrequency) return;
    lastUpdate = ecsState.elapsedSeconds;

    for (const entity of modelVariantQuery()) {
        setModelVariant(entity);
    }
    for (const entity of meshVariantQuery()) {
        setMeshVariant(entity);
    }
    for (const entity of instancedMeshVariantQuery()) {
        setInstancedMeshVariant(entity);
    }
}

function reactor() {
    const performanceOffset = useMutableState(PerformanceState).gpuPerformanceOffset;

    useEffect(() => {
        if (getState(EngineState).isEditing) return;
        const offset = performanceOffset.value;
        for (const entity of modelVariantQuery()) {
            setModelVariantLOD(entity, offset);
        }
    }, [performanceOffset]);

    return null;
}

export const VariantSystem = defineSystem({
    uuid: "ee.engine.scene.VariantSystem",
    insert: { after: PresentationSystemGroup },
    execute,
    reactor,
});
