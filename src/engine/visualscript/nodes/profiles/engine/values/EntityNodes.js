import { cloneDeep, isEqual, uniqueId } from "lodash";

import { UUIDComponent } from "../../../../../../ecs";
import {
    ComponentMap,
    getComponent,
    hasComponent,
    setComponent,
} from "../../../../../../ecs/ComponentFunctions";
import { Engine } from "../../../../../../ecs/Engine";
import { UndefinedEntity } from "../../../../../../ecs/Entity";
import { removeEntity } from "../../../../../../ecs/EntityFunctions";
import { defineQuery } from "../../../../../../ecs/QueryFunctions";
import { defineSystem, destroySystem } from "../../../../../../ecs/SystemFunctions";
import { InputSystemGroup } from "../../../../../../ecs/SystemGroups";
import { AvatarComponent } from "../../../../../../engine/avatar/components/AvatarComponent";
import { teleportAvatar } from "../../../../../../engine/avatar/functions/moveAvatar";
import { NameComponent } from "../../../../../../spatial/common/NameComponent";
import { RigidBodyComponent } from "../../../../../../spatial/physics/components/RigidBodyComponent";
import { copyTransformToRigidBody } from "../../../../../../spatial/physics/systems/PhysicsPreTransformSystem";
import { TransformComponent } from "../../../../../../spatial/transform/components/TransformComponent";
import {
    NodeCategory,
    makeEventNodeDefinition,
    makeFlowNodeDefinition,
    makeFunctionNodeDefinition,
    makeInNOutFunctionDesc,
    toQuat,
    toVector3,
} from "../../../../../../visual-script";

import { SourceComponent } from "../../../../../scene/components/SourceComponent";
import { addEntityToScene } from "../helper/entityHelper";

const initialState = () => ({
    systemUUID: "",
});

const sceneQuery = defineQuery([SourceComponent]);

export const getEntity = makeFunctionNodeDefinition({
    typeName: "logic/entity/get/entityInScene",
    category: NodeCategory.Logic,
    label: "Get entity in scene",
    in: {
        entity: _ => {
            const choices = sceneQuery().map(entity => ({
                text: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
            }));
            return {
                valueType: "string",
                choices: choices,
                defaultValue: "",
            };
        },
    },
    out: { entity: "entity" },
    exec: ({ read, write }) => {
        const entityUUID = read("entity");
        const entity = UUIDComponent.getEntityByUUID(entityUUID);
        write("entity", entity);
    },
});

export const getLocalClientEntity = makeFunctionNodeDefinition({
    typeName: "logic/entity/get/localClientEntity",
    category: NodeCategory.Logic,
    label: "Get local client entity",
    in: {},
    out: { entity: "entity" },
    exec: ({ write }) => {
        const entity = AvatarComponent.getSelfAvatarEntity();
        write("entity", entity);
    },
});

export const getCameraEntity = makeFunctionNodeDefinition({
    typeName: "logic/entity/get/cameraEntity",
    category: NodeCategory.Logic,
    label: "Get camera entity",
    in: {},
    out: { entity: "entity" },
    exec: ({ write }) => {
        const entity = Engine.instance.cameraEntity;
        write("entity", entity);
    },
});

export const entityExists = makeFlowNodeDefinition({
    typeName: "logic/entity/exists",
    category: NodeCategory.Logic,
    label: "Entity exists",
    in: {
        flow: "flow",
        entity: "entity",
    },
    out: {
        flow: "flow",
        exists: "boolean",
        entity: "entity",
        uuid: "string",
        position: "vec3",
        rotation: "quat",
        scale: "vec3",
        matrix: "mat4",
    },
    initialState: undefined,
    triggered: ({ read, write, commit }) => {
        const entity = read("entity");
        if (!entity) {
            write("exists", false);
        } else {
            write("exists", true);
            write("entity", entity);
            const transform = getComponent(entity, TransformComponent);
            write("position", transform.position);
            write("rotation", transform.rotation);
            write("scale", transform.scale);
            write("matrix", transform.matrix);
            write("uuid", getComponent(entity, UUIDComponent));
        }
        commit("flow");
    },
});

export const addEntity = makeFlowNodeDefinition({
    typeName: "logic/entity/addEntity",
    category: NodeCategory.Logic,
    label: "Add entity",
    in: {
        flow: "flow",
        parentEntity: _ => {
            const choices = sceneQuery().map(entity => ({
                text: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
            }));
            return {
                valueType: "string",
                choices: choices,
                defaultValue: "",
            };
        },
        componentName: _ => {
            const choices = Array.from(ComponentMap.entries())
                .filter(([, component]) => !!component.jsonID)
                .map(([name]) => name)
                .sort();
            return {
                valueType: "string",
                choices: choices,
                defaultValue: TransformComponent.name,
            };
        },
        entityName: "string",
    },
    out: { flow: "flow", entity: "entity" },
    initialState: undefined,
    triggered: ({ read, write, commit }) => {
        const parentEntityUUID = read("parentEntity");
        const parentEntity =
            parentEntityUUID == ""
                ? UndefinedEntity
                : UUIDComponent.getEntityByUUID(parentEntityUUID);
        const componentName = read("componentName");
        const entity = addEntityToScene(
            [{ name: ComponentMap.get(componentName).jsonID }],
            parentEntity,
        );
        const entityName = read("entityName");
        if (entityName.length > 0) setComponent(entity, NameComponent, entityName);
        write("entity", entity);
        commit("flow");
    },
});

export const deleteEntity = makeFlowNodeDefinition({
    typeName: "logic/entity/deleteEntity",
    category: NodeCategory.Logic,
    label: "Delete entity",
    in: {
        flow: "flow",
        entityUUID: _ => {
            const choices = sceneQuery().map(entity => ({
                text: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
            }));
            choices.unshift({ text: "none", value: "" });
            return {
                valueType: "string",
                choices: choices, // no default beacause we dont want to acciedently delete the default, none is safer
            };
        },
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit }) => {
        const entityUUID = read("entityUUID");
        const entity = UUIDComponent.getEntityByUUID(entityUUID);
        removeEntity(entity);
        commit("flow");
    },
});

export const getEntityTransform = makeFunctionNodeDefinition({
    typeName: "engine/entity/TransformComponent/get",
    category: NodeCategory.Engine,
    label: "Get entity transform",
    in: {
        entity: "entity",
    },
    out: { entity: "entity", position: "vec3", rotation: "quat", scale: "vec3", matrix: "mat4" },
    exec: ({ read, write }) => {
        const entity = Number(read("entity"));
        const transform = getComponent(entity, TransformComponent);
        write("position", transform.position);
        write("rotation", transform.rotation);
        write("scale", transform.scale);
        write("matrix", transform.matrix);
        write("entity", entity);
    },
});

export const setEntityTransform = makeFlowNodeDefinition({
    typeName: "engine/entity/TransformComponent/set",
    category: NodeCategory.Engine,
    label: "set transformComponent",
    in: {
        flow: "flow",
        entity: "entity",
        position: "vec3",
        rotation: "quat",
        scale: "vec3",
    },
    out: { flow: "flow", entity: "entity" },
    initialState: undefined,
    triggered: ({ read, write, commit }) => {
        const position = toVector3(read("position"));
        const rotation = toQuat(read("rotation"));
        const scale = toVector3(read("scale"));
        const entity = Number(read("entity"));
        if (entity === AvatarComponent.getSelfAvatarEntity()) {
            teleportAvatar(entity, position, true);
        } else {
            setComponent(entity, TransformComponent, {
                position: position,
                rotation: rotation,
                scale: scale,
            });
            if (hasComponent(entity, RigidBodyComponent)) copyTransformToRigidBody(entity);
        }
        write("entity", entity);
        commit("flow");
    },
});

export const useEntityTransform = makeEventNodeDefinition({
    typeName: "engine/entity/TransformComponent/use",
    category: NodeCategory.Engine,
    label: "Use entity transform",
    in: {
        entity: "entity",
    },
    out: {
        entity: "entity",
        positionChange: "flow",
        position: "vec3",
        rotationChange: "flow",
        rotation: "quat",
        scaleChange: "flow",
        scale: "vec3",
    },
    initialState: initialState(),
    init: ({ read, commit, write }) => {
        const entity = Number(read("entity"));
        const prevTransform = {};
        const systemUUID = defineSystem({
            uuid: "visual-script-useTransform-" + uniqueId(),
            insert: { with: InputSystemGroup },
            execute: () => {
                const transform = getComponent(entity, TransformComponent);
                Object.entries(transform).forEach(([key, value]) => {
                    if (!Object.keys(useEntityTransform.out).includes(key)) return;
                    if (Object.hasOwn(prevTransform, key)) {
                        if (isEqual(prevTransform[key], transform[key])) return;
                    }
                    write(key, value);
                    commit(`${key}Change`);
                    prevTransform[key] = cloneDeep(transform[key]);
                });
            },
            reactor: () => {
                /*const transformState = useComponent(entity, TransformComponent)
        Object.entries(transformState.value).forEach(([key, value]) => {
          if (!Object.keys(useEntityTransform.out).includes(key)) return
          useEffect(() => {
            write(key, value)
            commit(`${key}Change`)
          }, [transformState[key]])
        })*/
                return null;
            },
        });
        const state = {
            systemUUID,
        };
        write("entity", entity);

        return state;
    },
    dispose: ({ state: { systemUUID } }) => {
        destroySystem(systemUUID);
        return initialState();
    },
});

export const getUUID = makeInNOutFunctionDesc({
    name: "logic/entity/getUuid",
    label: "Entity uuid",
    in: ["entity"],
    out: "string",
    exec: entity => getComponent(entity, UUIDComponent),
});

export const Constant = makeInNOutFunctionDesc({
    name: "logic/entity/constant",
    label: "Entity",
    in: ["entity"],
    out: "entity",
    exec: a => a,
});

export const Equal = makeInNOutFunctionDesc({
    name: "logic/entity/compare/equal",
    label: "Entity =",
    in: ["entity", "entity"],
    out: "boolean",
    exec: (a, b) => a === b,
});
