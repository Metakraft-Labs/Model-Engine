import React, { useEffect } from "react";
import matches from "ts-matches";

import {
    defineComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { DistanceFromCameraComponent } from "../../../spatial/transform/components/DistanceComponents";

import { setInstancedMeshVariant, updateModelVariant } from "../functions/loaders/VariantFunctions";
import { InstancingComponent } from "./InstancingComponent";
import { ModelComponent } from "./ModelComponent";

export const distanceBased = variantComponent => {
    return (
        variantComponent.heuristic === Heuristic.DISTANCE ||
        (variantComponent.heuristic === Heuristic.BUDGET && variantComponent.useDistance)
    );
};

export const VariantComponent = defineComponent({
    name: "EE_variant",
    jsonID: "EE_variant",

    onInit: entity => ({
        levels: [],
        heuristic: Heuristic.MANUAL,
        useDistance: false,
        currentLevel: 0,
        budgetLevel: 0,
    }),

    onSet: (entity, component, json) => {
        if (!json) return;

        if (typeof json.heuristic === "string") component.heuristic.set(json.heuristic);
        if (
            !!json.levels &&
            matches
                .arrayOf(
                    matches.shape({
                        src: matches.string,
                        metadata: matches.any,
                    }),
                )
                .test(json.levels)
        ) {
            if (component.heuristic.value === Heuristic.BUDGET) {
                json.levels = json.levels.sort((left, right) => {
                    const leftVertexCount = left.metadata["vertexCount"]
                        ? left.metadata["vertexCount"]
                        : 0;
                    const rightVertexCount = right.metadata["vertexCount"]
                        ? right.metadata["vertexCount"]
                        : 0;
                    return rightVertexCount - leftVertexCount;
                });
            }
            component.levels.set(json.levels);
        }

        if (typeof json.useDistance === "boolean") component.useDistance.set(json.useDistance);
        if (typeof json.currentLevel === "number") component.currentLevel.set(json.currentLevel);
        if (typeof json.budgetLevel === "number") component.currentLevel.set(json.budgetLevel);
    },

    toJSON: (entity, component) => ({
        levels: component.levels.value.map(level => {
            return {
                src: level.src,
                metadata: level.metadata,
            };
        }),
        heuristic: component.heuristic.value,
        useDistance: component.useDistance.value,
    }),

    reactor: VariantReactor,
});

function VariantReactor() {
    const entity = useEntityContext();
    const variantComponent = useComponent(entity, VariantComponent);
    const modelComponent = useOptionalComponent(entity, ModelComponent);
    const meshComponent = getOptionalComponent(entity, MeshComponent);

    useEffect(() => {
        const currentLevel = variantComponent.currentLevel.value;
        let src = undefined;
        if (variantComponent.heuristic.value === Heuristic.BUDGET) {
            const budgetLevel = variantComponent.budgetLevel.value;
            if (currentLevel >= budgetLevel) {
                src = variantComponent.levels[currentLevel].src.value;
            } else {
                src = variantComponent.levels[budgetLevel].src.value;
            }
        } else {
            src =
                variantComponent.levels[currentLevel].src &&
                variantComponent.levels[currentLevel].src.value;
        }

        if (src && modelComponent && modelComponent.src.value !== src) modelComponent.src.set(src);
    }, [variantComponent.currentLevel]);

    useEffect(() => {
        if (variantComponent.heuristic.value === Heuristic.BUDGET)
            updateModelVariant(entity, variantComponent, modelComponent);
    }, [variantComponent.budgetLevel]);

    useEffect(() => {
        if (distanceBased(variantComponent.value) && meshComponent) {
            meshComponent.removeFromParent();
        }
    }, [meshComponent]);

    return (
        <>
            {variantComponent.levels.map((level, index) => (
                <VariantLevelReactor entity={entity} level={index} key={`${entity}-${index}`} />
            ))}
        </>
    );
}

const VariantLevelReactor = React.memo(({ entity, level }) => {
    const variantComponent = useComponent(entity, VariantComponent);
    const variantLevel = variantComponent.levels[level];

    useEffect(() => {
        //if the variant heuristic is set to Distance, add the DistanceFromCameraComponent
        if (distanceBased(variantComponent.value)) {
            setComponent(entity, DistanceFromCameraComponent);
            variantLevel.metadata["minDistance"].value === undefined &&
                variantLevel.metadata["minDistance"].set(0);
            variantLevel.metadata["maxDistance"].value === undefined &&
                variantLevel.metadata["maxDistance"].set(0);
        } else {
            //otherwise, remove the DistanceFromCameraComponent
            hasComponent(entity, DistanceFromCameraComponent) &&
                removeComponent(entity, DistanceFromCameraComponent);
        }
    }, [variantComponent.heuristic]);

    const meshComponent = useOptionalComponent(entity, MeshComponent);
    const instancingComponent = getOptionalComponent(entity, InstancingComponent);

    useEffect(() => {
        meshComponent && instancingComponent && setInstancedMeshVariant(entity);
    }, [variantLevel.src, variantLevel.metadata, meshComponent]);

    return null;
});
