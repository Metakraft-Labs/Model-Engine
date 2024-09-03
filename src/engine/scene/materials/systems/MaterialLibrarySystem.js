import React, { useEffect } from "react";

import {
    getComponent,
    getOptionalComponent,
    PresentationSystemGroup,
    QueryReactor,
    removeEntity,
    setComponent,
    UndefinedEntity,
    useComponent,
    useEntityContext,
    useOptionalComponent,
} from "../../../../ecs";
import { defineSystem } from "../../../../ecs/SystemFunctions";
import { MaterialPrototypeDefinitions } from "../../../../spatial/renderer/materials/MaterialComponent";
import {
    createAndAssignMaterial,
    createMaterialPrototype,
    materialPrototypeMatches,
    setMeshMaterial,
    updateMaterialPrototype,
} from "../../../../spatial/renderer/materials/materialFunctions";

import { isArray } from "lodash";
import { MeshBasicMaterial } from "three";
import { MeshComponent } from "../../../../spatial/renderer/components/MeshComponent";
import {
    MaterialInstanceComponent,
    MaterialStateComponent,
} from "../../../../spatial/renderer/materials/MaterialComponent";
import { SourceComponent } from "../../components/SourceComponent";

const reactor = () => {
    useEffect(() => {
        MaterialPrototypeDefinitions.map((prototype, uuid) => createMaterialPrototype(prototype));
        const fallbackMaterial = new MeshBasicMaterial({
            name: "Fallback Material",
            color: 0xff69b4,
        });
        fallbackMaterial.uuid = MaterialStateComponent.fallbackMaterial;
        createAndAssignMaterial(UndefinedEntity, fallbackMaterial);
    }, []);

    return (
        <>
            <QueryReactor
                Components={[MaterialInstanceComponent]}
                ChildEntityReactor={MaterialInstanceReactor}
            />
            <QueryReactor
                Components={[MaterialStateComponent]}
                ChildEntityReactor={MaterialEntityReactor}
            />
            <QueryReactor Components={[MeshComponent]} ChildEntityReactor={MeshReactor} />
        </>
    );
};

const MeshReactor = () => {
    const entity = useEntityContext();
    const materialComponent = useOptionalComponent(entity, MaterialInstanceComponent);
    const meshComponent = useComponent(entity, MeshComponent);

    const createAndSourceMaterial = material => {
        const materialEntity = createAndAssignMaterial(entity, material);
        const source = getOptionalComponent(entity, SourceComponent);
        if (source) setComponent(materialEntity, SourceComponent, source);
    };

    useEffect(() => {
        if (materialComponent) return;
        const material = meshComponent.material.value;
        if (!isArray(material)) createAndSourceMaterial(material);
        else for (const mat of material) createAndSourceMaterial(mat);
    }, []);
    return null;
};

const MaterialEntityReactor = () => {
    const entity = useEntityContext();
    const materialComponent = useComponent(entity, MaterialStateComponent);
    useEffect(() => {
        if (!materialComponent.instances.value) return;
        for (const sourceEntity of materialComponent.instances.value) {
            const sourceComponent = getComponent(sourceEntity, SourceComponent);
            if (!SourceComponent.entitiesBySource[sourceComponent]) return;
            for (const entity of SourceComponent.entitiesBySource[
                getComponent(sourceEntity, SourceComponent)
            ]) {
                const uuid = getOptionalComponent(entity, MaterialInstanceComponent)?.uuid;
                if (uuid) setMeshMaterial(entity, uuid);
            }
        }
    }, [materialComponent.material]);

    useEffect(() => {
        if (materialComponent.prototypeEntity.value && !materialPrototypeMatches(entity))
            updateMaterialPrototype(entity);
    }, [materialComponent.prototypeEntity]);

    useEffect(() => {
        if (materialComponent.instances.value?.length === 0) removeEntity(entity);
    }, [materialComponent.instances]);

    return null;
};

const MaterialInstanceReactor = () => {
    const entity = useEntityContext();
    const materialComponent = useComponent(entity, MaterialInstanceComponent);
    const uuid = materialComponent.uuid;
    useEffect(() => {
        if (uuid.value) setMeshMaterial(entity, uuid.value);
    }, [materialComponent.uuid]);
    return null;
};

export const MaterialLibrarySystem = defineSystem({
    uuid: "ee.engine.scene.MaterialLibrarySystem",
    insert: { after: PresentationSystemGroup },
    reactor,
});
