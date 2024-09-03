import { UUIDComponent } from "../../../../../../ecs";
import {
    ComponentJSONIDMap,
    getComponent,
    hasComponent,
    setComponent,
} from "../../../../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../../../../ecs/Entity";
import { createEntity, generateEntityUUID } from "../../../../../../ecs/EntityFunctions";
import { VisibleComponent } from "../../../../../../spatial/renderer/components/VisibleComponent";
import { EntityTreeComponent } from "../../../../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../../../../spatial/transform/components/TransformComponent";

export const addEntityToScene = (
    componentJson,
    parentEntity = UndefinedEntity,
    beforeEntity = UndefinedEntity,
) => {
    const newEntity = createEntity();
    let childIndex = undefined;
    if (beforeEntity) {
        const beforeNode = getComponent(beforeEntity, EntityTreeComponent);
        if (
            beforeNode?.parentEntity &&
            hasComponent(beforeNode.parentEntity, EntityTreeComponent)
        ) {
            childIndex = getComponent(
                beforeNode.parentEntity,
                EntityTreeComponent,
            ).children.indexOf(beforeEntity);
        }
    }
    setComponent(newEntity, EntityTreeComponent, { parentEntity, childIndex });
    setComponent(newEntity, TransformComponent);
    const uuid = generateEntityUUID();
    setComponent(newEntity, UUIDComponent, uuid);
    setComponent(newEntity, VisibleComponent);
    for (const component of componentJson) {
        if (ComponentJSONIDMap.has(component.name))
            setComponent(newEntity, ComponentJSONIDMap.get(component.name), component.props);
    }
    return newEntity;
};
