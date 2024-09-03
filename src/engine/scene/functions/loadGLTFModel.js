import { v4 as uuidv4 } from "uuid";

import { UUIDComponent } from "../../../ecs";
import {
    ComponentJSONIDMap,
    ComponentMap,
    getComponent,
    getOptionalComponent,
    hasComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import { TransformComponent } from "../../../spatial";
import iterateObject3D from "../../../spatial/common/functions/iterateObject3D";
import { NameComponent } from "../../../spatial/common/NameComponent";
import {
    addObjectToGroup,
    GroupComponent,
} from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { Object3DComponent } from "../../../spatial/renderer/components/Object3DComponent";
import { ObjectLayerMaskComponent } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";
import { FrustumCullCameraComponent } from "../../../spatial/transform/components/DistanceComponents";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { computeTransformMatrix } from "../../../spatial/transform/systems/TransformSystem";

import { ColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { BoneComponent } from "../../avatar/components/BoneComponent";
import { SkinnedMeshComponent } from "../../avatar/components/SkinnedMeshComponent";
import { GLTFLoadedComponent } from "../components/GLTFLoadedComponent";
import { InstancingComponent } from "../components/InstancingComponent";
import { ModelComponent } from "../components/ModelComponent";
import { SourceComponent } from "../components/SourceComponent";
import { getModelSceneID } from "./loaders/ModelFunctions";

export const parseECSData = userData => {
    const components = {};
    const prefabs = {};
    const keysToRemove = [];
    const data = [...Object.entries(userData)];
    for (const [key, value] of data) {
        const parts = key.split(".");
        if (parts.length > 1) {
            if (parts[0] === "xrengine") {
                keysToRemove.push(key);
                const componentExists = ComponentMap.has(parts[1]);
                const _toLoad = componentExists ? components : prefabs;
                if (typeof _toLoad[parts[1]] === "undefined") {
                    _toLoad[parts[1]] = {};
                }
                if (parts.length > 2) {
                    let val = value;
                    if (value === "true") val = true;
                    if (value === "false") val = false;
                    _toLoad[parts[1]][parts[2]] = val;
                }
            }
        }
    }

    // remove keys that have been processed as they will be exported in different format
    for (const key of keysToRemove) {
        delete userData[key];
    }

    const result = [];
    for (const [key, value] of Object.entries(components)) {
        const component = ComponentMap.get(key);
        if (typeof component === "undefined") {
            console.warn(`Could not load component '${key}'`);
            continue;
        }
        result.push({ name: component.jsonID, props: value });
    }

    for (const [key, value] of Object.entries(prefabs)) {
        const Component = ComponentJSONIDMap.get(key);
        if (typeof Component === "undefined") {
            console.warn(`Could not load component '${key}'`);
            continue;
        }
        result.push({ name: Component.jsonID, props: value });
    }

    return result;
};

export const createObjectEntityFromGLTF = obj3d => {
    return parseECSData(obj3d.userData);
};

export const parseObjectComponentsFromGLTF = (entity, object3d) => {
    const scene = object3d ?? getComponent(entity, ModelComponent).scene;
    const meshesToProcess = [];

    if (!scene) return {};

    scene.traverse(mesh => {
        if ("xrengine.entity" in mesh.userData) {
            meshesToProcess.push(mesh);
        }
    });

    const entityJson = {};

    for (const mesh of meshesToProcess) {
        const name = mesh.userData["xrengine.entity"] ?? mesh.uuid;
        const uuid = mesh.uuid;
        const eJson = {
            name,
            components: [],
        };
        eJson.components.push(...createObjectEntityFromGLTF(mesh));

        entityJson[uuid] = eJson;
    }

    return entityJson;
};

export const parseGLTFModel = (entity, scene) => {
    const model = getComponent(entity, ModelComponent);

    scene.updateMatrixWorld(true);
    computeTransformMatrix(entity);

    // always parse components first using old ECS parsing schema
    const entityJson = parseObjectComponentsFromGLTF(entity, scene);
    // current ECS parsing schema

    const children = [...scene.children];
    for (const child of children) {
        child.parent = model.scene;
        iterateObject3D(child, obj => {
            const uuid = obj.userData?.gltfExtensions?.EE_uuid || obj.uuid || uuidv4();
            obj.uuid = uuid;
            const eJson = generateEntityJsonFromObject(entity, obj, entityJson[uuid]);
            entityJson[uuid] = eJson;
        });
    }

    return entityJson;
};

export const proxifyParentChildRelationships = obj => {
    const objEntity = obj.entity;
    Object.defineProperties(obj, {
        matrixWorld: {
            get() {
                return getComponent(objEntity, TransformComponent).matrixWorld;
            },
            set(value) {
                if (value != undefined)
                    throw new Error("Cannot set matrixWorld of proxified object");
                console.warn(
                    "Setting to nil value is not supported LoadGLTFModel.ts: proxifyParentChildRelationships",
                );
            },
        },
        parent: {
            get() {
                if (RendererComponent.activeRender) return null; // hack to check if renderer is rendering
                if (getOptionalComponent(objEntity, EntityTreeComponent)?.parentEntity) {
                    const result = getOptionalComponent(
                        getComponent(objEntity, EntityTreeComponent).parentEntity,
                        GroupComponent,
                    )?.[0];
                    return result ?? null;
                }
                return null;
            },
            set(value) {
                if (value != undefined) throw new Error("Cannot set parent of proxified object");
                console.warn(
                    "Setting to nil value is not supported LoadGLTFModel.ts: proxifyParentChildRelationships",
                );
            },
        },
        children: {
            get() {
                if (RendererComponent.activeRender) return []; // hack to check if renderer is rendering
                if (hasComponent(objEntity, EntityTreeComponent)) {
                    const childEntities = getComponent(objEntity, EntityTreeComponent).children;
                    const result = [];
                    for (const childEntity of childEntities) {
                        if (hasComponent(childEntity, MeshComponent)) {
                            result.push(getComponent(childEntity, MeshComponent));
                        } else if (hasComponent(childEntity, Object3DComponent)) {
                            result.push(getComponent(childEntity, Object3DComponent));
                        }
                    }
                    return result;
                } else {
                    return [];
                }
            },
            set(value) {
                if (value != undefined) throw new Error("Cannot set children of proxified object");
                console.warn(
                    "Setting to nil value is not supported LoadGLTFModel.ts: proxifyParentChildRelationships",
                );
            },
        },
        isProxified: {
            value: true,
        },
    });
};

export const generateEntityJsonFromObject = (rootEntity, obj, entityJson) => {
    if (!obj.uuid) throw new Error("Object3D must have a UUID");

    // create entity outside of scene loading reactor since we need to access it before the reactor is guaranteed to have executed
    const objEntity = UUIDComponent.getOrCreateEntityByUUID(obj.uuid);
    const parentEntity = obj.parent ? obj.parent.entity : rootEntity;
    const uuid = obj.uuid;
    const name = obj.userData["xrengine.entity"] ?? obj.name;

    const eJson = entityJson ?? {
        name,
        components: [],
    };

    eJson.parent = getComponent(parentEntity, UUIDComponent);

    const sceneID = getModelSceneID(rootEntity);
    setComponent(objEntity, SourceComponent, sceneID);
    setComponent(objEntity, EntityTreeComponent, {
        parentEntity,
    });
    setComponent(objEntity, UUIDComponent, uuid);

    setComponent(objEntity, NameComponent, name);
    setComponent(objEntity, TransformComponent, {
        position: obj.position.clone(),
        rotation: obj.quaternion.clone(),
        scale: obj.scale.clone(),
    });
    computeTransformMatrix(objEntity);

    for (const component of eJson.components) {
        if (ComponentJSONIDMap.has(component.name))
            setComponent(objEntity, ComponentJSONIDMap.get(component.name), component.props);
    }

    if (!eJson.components.find(c => c.name === TransformComponent.jsonID))
        eJson.components.push({
            name: TransformComponent.jsonID,
            props: {
                position: obj.position.clone(),
                rotation: obj.quaternion.clone(),
                scale: obj.scale.clone(),
            },
        });

    addObjectToGroup(objEntity, obj);
    setComponent(objEntity, GLTFLoadedComponent, ["entity"]);
    ObjectLayerMaskComponent.setMask(objEntity, ObjectLayerMaskComponent.mask[rootEntity]);

    /** Proxy children with EntityTreeComponent if it exists */
    proxifyParentChildRelationships(obj);

    obj.removeFromParent = () => {
        if (getOptionalComponent(objEntity, EntityTreeComponent)?.parentEntity) {
            setComponent(objEntity, EntityTreeComponent, { parentEntity: UndefinedEntity });
        }
        return obj;
    };

    const findColliderData = obj => {
        if (
            hasComponent(obj.entity, ColliderComponent) ||
            Object.keys(obj.userData).find(
                key =>
                    key.startsWith("xrengine.collider") || key.startsWith("xrengine.EE_collider"),
            )
        ) {
            return true;
        }
        // else if (obj.parent) {
        //   return (
        //     hasComponent(obj.parent.entity, ColliderComponent) ||
        //     Object.keys(obj.parent.userData).some(
        //       (key) => key.startsWith('xrengine.collider') || key.startsWith('xrengine.EE_collider')
        //     )
        //   )
        // }
        return false;
    };
    //if we're not using visible component, set visible by default
    if (
        !obj.userData["useVisible"] &&
        //if this object has a collider component attached to it, set visible to false
        !findColliderData(obj)
    ) {
        setComponent(objEntity, VisibleComponent, true);
        eJson.components.push({
            name: VisibleComponent.jsonID,
            props: true,
        });
    }

    const mesh = obj;
    mesh.isMesh && setComponent(objEntity, MeshComponent, mesh);

    //check if mesh is instanced. If so, add InstancingComponent
    const instancedMesh = obj;
    instancedMesh.isInstancedMesh &&
        setComponent(objEntity, InstancingComponent, {
            instanceMatrix: instancedMesh.instanceMatrix,
        });

    const bone = obj;
    bone.isBone && setComponent(objEntity, BoneComponent, bone);

    const skinnedMesh = obj;
    if (skinnedMesh.isSkinnedMesh) setComponent(objEntity, SkinnedMeshComponent, skinnedMesh);
    else setComponent(objEntity, FrustumCullCameraComponent);

    if (obj.userData["componentJson"]) {
        for (const json of obj.userData["componentJson"]) {
            if (!eJson.components.find(c => c.name === json.name)) eJson.components.push(json);
        }
    }

    if (!hasComponent(objEntity, MeshComponent)) {
        setComponent(objEntity, Object3DComponent, obj);
    }

    const material = mesh.material;
    if (!material) return eJson;

    delete mesh.userData["componentJson"];
    delete mesh.userData["gltfExtensions"];
    delete mesh.userData["useVisible"];

    return eJson;
};
