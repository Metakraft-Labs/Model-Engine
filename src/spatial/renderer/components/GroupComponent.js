import React, { memo } from "react";
import { Camera } from "three";

import {
    defineComponent,
    getComponent,
    getMutableComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { QueryReactor } from "../../../ecs/QueryFunctions";
import { none } from "../../../hyperflux";

import {
    proxifyQuaternionWithDirty,
    proxifyVector3WithDirty,
} from "../../common/proxies/createThreejsProxy";
import { TransformComponent } from "../../transform/components/TransformComponent";
import { Layer } from "./ObjectLayerComponent";

export const GroupComponent = defineComponent({
    name: "GroupComponent",

    onInit: _entity => {
        return [];
    },

    onRemove: (entity, component) => {
        for (const obj of component.value) {
            if (obj.parent) {
                obj.removeFromParent();
            }
        }
    },
});

export function addObjectToGroup(entity, object) {
    const obj = object & Camera;
    obj.entity = entity;

    if (!hasComponent(entity, GroupComponent)) setComponent(entity, GroupComponent, []);
    if (getComponent(entity, GroupComponent).includes(obj))
        return console.warn(
            "[addObjectToGroup]: Tried to add an object that is already included",
            entity,
            object,
        );
    if (!hasComponent(entity, TransformComponent)) setComponent(entity, TransformComponent);

    getMutableComponent(entity, GroupComponent).merge([obj]);

    const transform = getComponent(entity, TransformComponent);
    obj.position.copy(transform.position);
    obj.quaternion.copy(transform.rotation);
    obj.scale.copy(transform.scale);
    obj.matrixAutoUpdate = false;
    obj.matrixWorldAutoUpdate = false;
    obj.matrix = transform.matrix;
    obj.matrixWorld = transform.matrixWorld;
    obj.layers = new Layer(entity);

    obj.frustumCulled = false;

    Object.assign(obj, {
        updateWorldMatrix: () => {},
    });

    // sometimes it's convenient to update the entity transform via the Object3D,
    // so allow people to do that via proxies
    proxifyVector3WithDirty(
        TransformComponent.position,
        entity,
        TransformComponent.dirtyTransforms,
        obj.position,
    );
    proxifyQuaternionWithDirty(
        TransformComponent.rotation,
        entity,
        TransformComponent.dirtyTransforms,
        obj.quaternion,
    );
    proxifyVector3WithDirty(
        TransformComponent.scale,
        entity,
        TransformComponent.dirtyTransforms,
        obj.scale,
    );
}

export function removeGroupComponent(entity) {
    if (hasComponent(entity, GroupComponent)) {
        for (const obj of getComponent(entity, GroupComponent)) obj.removeFromParent();
        removeComponent(entity, GroupComponent);
    }
}

export function removeObjectFromGroup(entity, object) {
    const obj = object & Camera;

    if (hasComponent(entity, GroupComponent)) {
        const group = getComponent(entity, GroupComponent);
        if (group.includes(obj)) {
            getMutableComponent(entity, GroupComponent)[group.indexOf(obj)].set(none);
        }
        if (!group.length) removeComponent(entity, GroupComponent);
    }

    if (object.parent) object.removeFromParent();
}

export const GroupReactor = memo(props => {
    const entity = useEntityContext();
    const groupComponent = useComponent(entity, GroupComponent);
    return (
        <>
            {groupComponent.value.map(obj => (
                <props.GroupChildReactor key={obj.uuid} entity={entity} obj={obj} />
            ))}
        </>
    );
});
GroupReactor.displayName = "GroupReactor";

export const GroupQueryReactor = memo(props => {
    return (
        <QueryReactor
            Components={[GroupComponent, ...(props.Components ?? [])]}
            ChildEntityReactor={() => <GroupReactor GroupChildReactor={props.GroupChildReactor} />}
        />
    );
});

GroupQueryReactor.displayName = "GroupQueryReactor";
