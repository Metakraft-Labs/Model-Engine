import { getComponent, hasComponent } from "../../../../ecs";
import { MaterialInstanceComponent } from "../../../../spatial/renderer/materials/MaterialComponent";

import { SourceComponent } from "../../components/SourceComponent";
import { getModelSceneID } from "../../functions/loaders/ModelFunctions";

/**Gets all materials used by child and self entity */
export const getMaterialsFromScene = source => {
    const sceneInstanceID = getModelSceneID(source);
    const childEntities = SourceComponent.entitiesBySource[sceneInstanceID] ?? [];
    childEntities.push(source);
    const materials = {};
    for (const entity of childEntities) {
        if (hasComponent(entity, MaterialInstanceComponent)) {
            const materialComponent = getComponent(entity, MaterialInstanceComponent);
            for (const mat of materialComponent.uuid) {
                materials[mat] = entity;
            }
        }
    }
    return Object.keys(materials);
};
