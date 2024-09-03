import { Group } from "three";
import {
    UUIDComponent,
    UndefinedEntity,
    createEntity,
    generateEntityUUID,
    getComponent,
    setComponent,
} from "../../../ecs";
import { TransformComponent } from "../../../spatial";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { Object3DComponent } from "../../../spatial/renderer/components/Object3DComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { proxifyParentChildRelationships } from "./loadGLTFModel";

import { SourceComponent } from "../components/SourceComponent";

export const createSceneEntity = (name, parentEntity = UndefinedEntity) => {
    const entity = createEntity();
    setComponent(entity, NameComponent, name);
    setComponent(entity, VisibleComponent);
    setComponent(entity, TransformComponent);
    setComponent(entity, EntityTreeComponent, { parentEntity });
    const sceneID = getComponent(parentEntity, SourceComponent);
    setComponent(entity, SourceComponent, sceneID);

    setComponent(entity, UUIDComponent, generateEntityUUID());

    // These additional properties and relations are required for
    // the current GLTF exporter to successfully generate a GLTF.
    const obj3d = new Group();
    obj3d.entity = entity;
    addObjectToGroup(entity, obj3d);
    proxifyParentChildRelationships(obj3d);
    setComponent(entity, Object3DComponent, obj3d);

    return entity;
};
