import { Matrix4, Quaternion, Vector3 } from "three";

import { getNestedObject } from "../../../common/src/utils/getNestedProperty";
import { generateEntityUUID, UUIDComponent } from "../../../ecs";
import {
    componentJsonDefaults,
    ComponentJSONIDMap,
    getComponent,
    getOptionalComponent,
    updateComponent,
} from "../../../ecs/ComponentFunctions";
import { GLTFDocumentState, GLTFSnapshotAction } from "../../../engine/gltf/GLTFDocumentState";
import { GLTFSnapshotState, GLTFSourceState } from "../../../engine/gltf/GLTFState";
import { SkyboxComponent } from "../../../engine/scene/components/SkyboxComponent";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { TransformSpace } from "../../../engine/scene/constants/transformConstants";
import { dispatchAction, getMutableState, getState } from "../../../hyperflux";
import { DirectionalLightComponent, HemisphereLightComponent } from "../../../spatial";
import { MAT4_IDENTITY } from "../../../spatial/common/constants/MathConstants";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { getMaterial } from "../../../spatial/renderer/materials/materialFunctions";
import {
    EntityTreeComponent,
    findCommonAncestors,
    iterateEntityNode,
} from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { computeTransformMatrix } from "../../../spatial/transform/systems/TransformSystem";

import { PostProcessingComponent } from "../../../spatial/renderer/components/PostProcessingComponent";
import { EditorHelperState } from "../services/EditorHelperState";
import { EditorState } from "../services/EditorServices";
import { SelectionState } from "../services/SelectionServices";

const tempMatrix4 = new Matrix4();
const tempVector = new Vector3();

const getSourcesForEntities = entities => {
    const scenes = {};
    for (const entity of entities) {
        const sceneID = getComponent(entity, SourceComponent);
        scenes[sceneID] ??= [];
        scenes[sceneID].push(entity);
    }
    return scenes;
};

const getGLTFNodeByUUID = (gltf, uuid) => {
    return gltf.nodes?.find(n => n.extensions?.[UUIDComponent.jsonID] === uuid);
};

const getParentNodeByUUID = (gltf, uuid) => {
    const nodeIndex = gltf.nodes?.findIndex(n => n.extensions?.[UUIDComponent.jsonID] === uuid);
    if (!nodeIndex || nodeIndex < 0) return;
    return gltf.nodes?.find(n => n.children?.includes(nodeIndex));
};

const hasComponentInAuthoringLayer = (entity, component) => {
    const componentJsonId = component.jsonID;
    if (!componentJsonId) return false;
    const source = getOptionalComponent(entity, SourceComponent);
    const uuid = getOptionalComponent(entity, UUIDComponent);
    if (!source || !uuid) return false;
    const doc = getState(GLTFDocumentState)[source];
    const node = getGLTFNodeByUUID(doc, uuid);
    return node?.extensions?.[componentJsonId] !== undefined;
};

const addOrRemoveComponent = (entities, component, add, args = undefined) => {
    const sceneComponentID = component.jsonID;
    if (!sceneComponentID) return;

    const scenes = getSourcesForEntities(entities);

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
        for (const entity of entities) {
            const entityUUID = getComponent(entity, UUIDComponent);
            const node = getGLTFNodeByUUID(gltf.data, entityUUID);
            if (!node) continue;
            if (add) {
                node.extensions[sceneComponentID] = {
                    ...componentJsonDefaults(ComponentJSONIDMap.get(sceneComponentID)),
                    ...args,
                };
            } else {
                delete node.extensions?.[sceneComponentID];
            }
        }
        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

const modifyName = (entities, name) => {
    const scenes = getSourcesForEntities(entities);

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);

        for (const entity of entities) {
            const entityUUID = getComponent(entity, UUIDComponent);
            const node = getGLTFNodeByUUID(gltf.data, entityUUID);
            if (!node) continue;
            node.name = name;
        }

        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

/**
 * Updates each property specified in 'properties' on the component for each of the specified entity nodes
 */
const modifyProperty = (entities, component, properties) => {
    const scenes = getSourcesForEntities(entities);

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);

        for (const entity of entities) {
            const entityUUID = getComponent(entity, UUIDComponent);
            const node = getGLTFNodeByUUID(gltf.data, entityUUID);
            if (!node) continue;
            if (typeof properties === "string") {
                node.extensions[component.jsonID] = properties;
            } else {
                Object.entries(properties).map(([k, v]) => {
                    const { result, finalProp } = getNestedObject(
                        node.extensions[component.jsonID],
                        k,
                    );
                    result[finalProp] = v;
                });
            }
        }

        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

const modifyMaterial = (nodes, materialId, properties) => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (typeof node !== "string") return;
        const material = getMaterial(materialId);
        if (!material) return;
        const props = properties[i] ?? properties[0];
        Object.entries(props).map(([k, v]) => {
            if (!material) throw new Error("Updating properties on undefined material");
            if (
                [undefined, null].includes(v) &&
                [undefined, null].includes(material[k]) &&
                typeof material[k] === "object" &&
                typeof material[k].set === "function"
            ) {
                material[k].set(v);
            } else {
                material[k] = v;
            }
        });
        material.needsUpdate = true;
    }
};
const overwriteLookdevObject = (
    beforeComponentJson = [],
    componentJson = [],
    parentEntity = getState(EditorState).rootEntity,
    beforeEntity,
) => {
    const scenes = getSourcesForEntities([parentEntity]);
    const entityUUID =
        componentJson.find(comp => comp.name === UUIDComponent.jsonID)?.props.uuid ??
        generateEntityUUID();

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const name = "Lookdev Object";
        if (getState(GLTFSourceState)[sceneID]) {
            const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
            const extensions = {};
            for (const comp of componentJson) {
                extensions[comp.name] = {
                    ...componentJsonDefaults(ComponentJSONIDMap.get(comp.name)),
                    ...comp.props,
                };
            }
            //check lookdev entity
            const lookDevComponent = [
                SkyboxComponent,
                HemisphereLightComponent,
                DirectionalLightComponent,
                PostProcessingComponent,
            ];
            let overwrited = false;
            for (const comp of lookDevComponent) {
                if (extensions[comp.jsonID]) {
                    const index = gltf.data.nodes?.findIndex(
                        n => n.extensions?.[comp.jsonID] !== undefined,
                    );
                    if (typeof index === "number" && index > -1) {
                        if (gltf.data.nodes !== undefined) {
                            gltf.data.nodes[index].extensions[comp.jsonID] =
                                extensions[comp.jsonID];
                            overwrited = true;
                        }
                    }
                }
            }
            if (!overwrited) {
                //if no lookdev object found then create new object
                createObjectFromSceneElement(beforeComponentJson, parentEntity, beforeEntity);
            } else {
                dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
            }
        }
    }
};
const createObjectFromSceneElement = (
    componentJson = [],
    parentEntity = getState(EditorState).rootEntity,
    beforeEntity,
) => {
    const scenes = getSourcesForEntities([parentEntity]);
    const entityUUIDUUID =
        componentJson.find(comp => comp.name === UUIDComponent.jsonID)?.props.uuid ??
        generateEntityUUID();
    const sceneIDUsed = Object.keys(scenes)[0];
    for (const [sceneID, entities] of Object.entries(scenes)) {
        const name = "New Object";
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);

        const nodeIndex = gltf.data.nodes.length;

        const extensions = {};
        for (const comp of componentJson) {
            extensions[comp.name] = {
                ...componentJsonDefaults(ComponentJSONIDMap.get(comp.name)),
                ...comp.props,
            };
        }
        if (!extensions[UUIDComponent.jsonID]) {
            extensions[UUIDComponent.jsonID] = entityUUID;
        }
        if (!extensions[VisibleComponent.jsonID]) {
            extensions[VisibleComponent.jsonID] = true;
        }

        const node = {
            name,
            extensions,
        };

        gltf.data.nodes.push(node);

        if (extensions[TransformComponent.jsonID]) {
            const comp = {
                ...componentJsonDefaults(TransformComponent),
                ...extensions[TransformComponent.jsonID],
            };
            const matrix = tempMatrix4.compose(
                new Vector3().copy(comp.position),
                new Quaternion().copy(comp.rotation),
                new Vector3().copy(comp.scale),
            );
            delete extensions[TransformComponent.jsonID];
            if (!matrix.equals(MAT4_IDENTITY)) node.matrix = matrix.toArray();
        }

        if (parentEntity === getState(EditorState).rootEntity) {
            const sceneIndex = 0; // TODO: how should this work? gltf.data.scenes.findIndex((s) => s.nodes.includes(nodeIndex))

            let beforeIndex = gltf.data.scenes[sceneIndex].nodes.length;
            if (typeof beforeEntity === "number") {
                const beforeUUID = getComponent(beforeEntity, UUIDComponent);
                const beforeNodeIndex = gltf.data.nodes?.findIndex(
                    n => n.extensions?.[UUIDComponent.jsonID] === beforeUUID,
                );
                if (typeof beforeNodeIndex === "number" && beforeNodeIndex > -1) {
                    beforeIndex = gltf.data.scenes[sceneIndex].nodes.indexOf(beforeNodeIndex);
                }
            }

            gltf.data.scenes[sceneIndex].nodes.splice(beforeIndex, 0, nodeIndex);
        } else {
            const parentUUID = getComponent(parentEntity, UUIDComponent);
            const parentNode = getGLTFNodeByUUID(gltf.data, parentUUID);
            if (!parentNode) continue;
            if (!parentNode.children) parentNode.children = [];
            let beforeIndex = 0;
            if (typeof beforeEntity === "number") {
                const beforeUUID = getComponent(beforeEntity, UUIDComponent);
                const beforeNodeIndex = gltf.data.nodes?.findIndex(
                    n => n.extensions?.[UUIDComponent.jsonID] === beforeUUID,
                );
                if (typeof beforeNodeIndex == "number" && beforeNodeIndex > -1) {
                    beforeIndex = parentNode.children.indexOf(beforeNodeIndex);
                }
            }
            parentNode.children.splice(beforeIndex, 0, nodeIndex);
        }
        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
    return { entityUUID, sceneID: sceneIDUsed };
};

/**
 * @todo copying an object should be rooted to which object is currently selected
 */
const duplicateObject = entities => {
    const scenes = getSourcesForEntities(entities);
    const copyMap = {};

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const rootEntities = findCommonAncestors(entities);

        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);

        /** Depth first */
        const duplicateNode = entity => {
            const entityUUID = getComponent(entity, UUIDComponent);
            const nodeIndex = gltf.data.nodes.findIndex(
                n => n.extensions?.[UUIDComponent.jsonID] === entityUUID,
            );
            const node = gltf.data.nodes[nodeIndex];

            const newChildren = [];
            if (node.children) {
                for (const childIndex of node.children) {
                    const childNode = gltf.data.nodes[childIndex];
                    const childEntityUUID = childNode.extensions[UUIDComponent.jsonID];
                    const newChildIndex = duplicateNode(
                        UUIDComponent.getEntityByUUID(childEntityUUID),
                    );
                    newChildren.push(newChildIndex);
                }
            }

            const entityDataClone = JSON.parse(JSON.stringify(node));
            const newUUID = generateEntityUUID();
            copyMap[entityUUID] = newUUID;
            entityDataClone.extensions[UUIDComponent.jsonID] = newUUID;
            if (newChildren.length) entityDataClone.children = newChildren;

            gltf.data.nodes.push(entityDataClone);

            const newIndex = gltf.data.nodes.length - 1;

            return newIndex;
        };

        for (const rootEntity of rootEntities) {
            const entityUUID = getComponent(rootEntity, UUIDComponent);
            const originalIndex = gltf.data.nodes.findIndex(
                n => n.extensions?.[UUIDComponent.jsonID] === entityUUID,
            );
            const newIndex = duplicateNode(rootEntity);

            const sceneIndex = gltf.data.scenes.findIndex(s => s.nodes.includes(originalIndex));

            if (sceneIndex > -1) {
                gltf.data.scenes[sceneIndex].nodes.push(newIndex);
            } else {
                const parentEntity = getComponent(rootEntity, EntityTreeComponent).parentEntity;
                if (!parentEntity) throw new Error("Root entity must have a parent");
                const parentEntityUUID = getComponent(parentEntity, UUIDComponent);
                const parentNode = getParentNodeByUUID(gltf.data, parentEntityUUID);
                if (!parentNode) throw new Error("Parent node not found");
                if (!parentNode.children) parentNode.children = [];
                parentNode.children.push(newIndex);
            }
        }

        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

const positionObject = (
    nodes,
    positions,
    space = getState(EditorHelperState).transformSpace,
    addToPosition,
) => {
    for (let i = 0; i < nodes.length; i++) {
        const entity = nodes[i];
        const pos = positions[i] ?? positions[0];

        const transform = getComponent(entity, TransformComponent);

        if (space === TransformSpace.local) {
            if (addToPosition) transform.position.add(pos);
            else transform.position.copy(pos);
        } else {
            const entityTreeComponent = getComponent(entity, EntityTreeComponent);
            const parentTransform = entityTreeComponent.parentEntity
                ? getComponent(entityTreeComponent.parentEntity, TransformComponent)
                : transform;

            tempVector.set(0, 0, 0);
            if (addToPosition) {
                tempVector.setFromMatrixPosition(transform.matrixWorld);
            }
            tempVector.add(pos);

            const _spaceMatrix = parentTransform.matrixWorld;
            tempMatrix4.copy(_spaceMatrix).invert();
            tempVector.applyMatrix4(tempMatrix4);

            transform.position.copy(tempVector);
        }

        updateComponent(entity, TransformComponent, { position: transform.position });

        iterateEntityNode(entity, entity => {
            computeTransformMatrix(entity);
            TransformComponent.dirtyTransforms[entity] = true;
        });
    }
};

const T_QUAT_1 = new Quaternion();
const T_QUAT_2 = new Quaternion();

const rotateObject = (nodes, rotations, space = getState(EditorHelperState).transformSpace) => {
    for (let i = 0; i < nodes.length; i++) {
        const entity = nodes[i];

        T_QUAT_1.setFromEuler(rotations[i] ?? rotations[0]);

        const transform = getComponent(entity, TransformComponent);

        if (space === TransformSpace.local) {
            transform.rotation.copy(T_QUAT_1);
        } else {
            const entityTreeComponent = getComponent(entity, EntityTreeComponent);
            const parentTransform = entityTreeComponent.parentEntity
                ? getComponent(entityTreeComponent.parentEntity, TransformComponent)
                : transform;

            const _spaceMatrix = parentTransform.matrixWorld;

            const inverseParentWorldQuaternion =
                T_QUAT_2.setFromRotationMatrix(_spaceMatrix).invert();
            const newLocalQuaternion = inverseParentWorldQuaternion.multiply(T_QUAT_1);

            transform.rotation.copy(newLocalQuaternion);
        }

        updateComponent(entity, TransformComponent, { rotation: transform.rotation });

        iterateEntityNode(entity, entity => {
            computeTransformMatrix(entity);
            TransformComponent.dirtyTransforms[entity] = true;
        });
    }
};

const rotateAround = (entities, axis, angle, pivot) => {
    const pivotToOriginMatrix = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
    const originToPivotMatrix = new Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);
    const rotationMatrix = new Matrix4().makeRotationAxis(axis, angle);

    for (const entity of entities) {
        const transform = getComponent(entity, TransformComponent);
        const entityTreeComponent = getComponent(entity, EntityTreeComponent);
        const parentTransform = entityTreeComponent.parentEntity
            ? getComponent(entityTreeComponent.parentEntity, TransformComponent)
            : transform;

        tempMatrix4
            .copy(transform.matrixWorld)
            .premultiply(pivotToOriginMatrix)
            .premultiply(rotationMatrix)
            .premultiply(originToPivotMatrix)
            .premultiply(tempMatrix4.copy(parentTransform.matrixWorld).invert())
            .decompose(transform.position, transform.rotation, transform.scale);

        updateComponent(entity, TransformComponent, { rotation: transform.rotation });
    }
};

const scaleObject = (entities, scales, overrideScale = false) => {
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const scale = scales[i] ?? scales[0];

        const transformComponent = getComponent(entity, TransformComponent);

        if (overrideScale) {
            transformComponent.scale.copy(scale);
        } else {
            transformComponent.scale.multiply(scale);
        }

        transformComponent.scale.set(
            transformComponent.scale.x === 0 ? Number.EPSILON : transformComponent.scale.x,
            transformComponent.scale.y === 0 ? Number.EPSILON : transformComponent.scale.y,
            transformComponent.scale.z === 0 ? Number.EPSILON : transformComponent.scale.z,
        );

        updateComponent(entity, TransformComponent, { scale: transformComponent.scale });
    }
};

const reparentObject = (entities, before, parent = getState(EditorState).rootEntity) => {
    const scenes = getSourcesForEntities(entities);

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);

        for (const entity of entities) {
            if (entity === parent) continue;

            const entityUUID = getComponent(entity, UUIDComponent);
            const nodeIndex = gltf.data.nodes.findIndex(
                n => n.extensions?.[UUIDComponent.jsonID] === entityUUID,
            );
            const isCurrentlyChildOfRoot = gltf.data.scenes[0].nodes.includes(nodeIndex);

            // Remove from current parent
            if (isCurrentlyChildOfRoot) {
                gltf.data.scenes[0].nodes.splice(gltf.data.scenes[0].nodes.indexOf(nodeIndex), 1);
            } else {
                const currentParentNode = getParentNodeByUUID(gltf.data, entityUUID);
                if (!currentParentNode) continue;
                const currentParentNodeIndex = currentParentNode.children.indexOf(nodeIndex);
                currentParentNode.children.splice(currentParentNodeIndex, 1);
                if (!currentParentNode.children?.length) delete currentParentNode.children;
            }

            // Ensure the entity Transform remains unmodified when reparented
            const node = getGLTFNodeByUUID(gltf.data, entityUUID); // Get the GLTF Node for the entity
            if (node) {
                // Get the transforms for both entitites
                const parentTransform = getComponent(parent, TransformComponent);
                const entityTransform = getComponent(entity, TransformComponent);
                // Calculate the new matrix relative to the new parent entity, and apply the matrix to its GLTF node.matrix
                node.matrix = tempMatrix4
                    .copy(entityTransform.matrixWorld)
                    .premultiply(parentTransform.matrixWorld.clone().invert())
                    .toArray();
            }

            const newParentUUID = getComponent(parent, UUIDComponent);
            const isParentRoot = parent === getState(EditorState).rootEntity;

            // Add to new parent
            if (isParentRoot) {
                if (before) {
                    const beforeIndex = gltf.data.nodes.findIndex(
                        n =>
                            n.extensions?.[UUIDComponent.jsonID] ===
                            getComponent(before, UUIDComponent),
                    );
                    gltf.data.scenes[0].nodes.splice(beforeIndex, 0, nodeIndex);
                    gltf.data.nodes?.splice(beforeIndex, 0, gltf.data.nodes?.[nodeIndex]);
                    gltf.data.nodes?.splice(nodeIndex + 1, 1);
                } else {
                    gltf.data.scenes[0].nodes.push(nodeIndex);
                    gltf.data.nodes?.push(gltf.data.nodes[nodeIndex]);
                }
            } else {
                const newParentNode = getGLTFNodeByUUID(gltf.data, newParentUUID);
                if (!newParentNode) continue;
                if (!newParentNode.children) newParentNode.children = [];
                if (before) {
                    const beforeIndex = newParentNode.children.findIndex(
                        n =>
                            n ===
                            gltf.data.nodes.find(
                                n =>
                                    n.extensions?.[UUIDComponent.jsonID] ===
                                    getComponent(before, UUIDComponent),
                            ),
                    );
                    newParentNode.children.splice(beforeIndex, 0, nodeIndex);
                } else {
                    newParentNode.children.push(nodeIndex);
                }
            }
        }

        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

/** @todo - grouping currently doesnt take into account parentEntity or beforeEntity */
const groupObjects = entities => {
    /**
     * @todo how does grouping work across multiple sources?
     * - it works by modifying both sources
     */

    const scenes = getSourcesForEntities(entities);
    const newGroupUUIDs = {};

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);

        /** 1. create new group node */
        const groupNode = {
            name: "New Group",
            extensions: {
                [UUIDComponent.jsonID]: generateEntityUUID(),
                // TODO figure out where the new position should be
                [TransformComponent.jsonID]: componentJsonDefaults(TransformComponent),
                [VisibleComponent.jsonID]: true,
            },
        };

        newGroupUUIDs[sceneID] = groupNode.extensions[UUIDComponent.jsonID];

        const groupIndex = gltf.data.nodes.push(groupNode) - 1;

        /** For each node being added to the group */
        for (const entity of entities) {
            const entityUUID = getComponent(entity, UUIDComponent);
            const nodeIndex = gltf.data.nodes.findIndex(
                n => n.extensions?.[UUIDComponent.jsonID] === entityUUID,
            );

            /** 2. remove node from current parent */
            const isCurrentlyChildOfRoot = gltf.data.scenes[0].nodes.includes(nodeIndex);
            if (isCurrentlyChildOfRoot) {
                gltf.data.scenes[0].nodes.splice(gltf.data.scenes[0].nodes.indexOf(nodeIndex), 1);
            } else {
                const currentParentNode = getParentNodeByUUID(gltf.data, entityUUID);
                if (!currentParentNode) continue;
                const currentParentNodeIndex = currentParentNode.children.indexOf(nodeIndex);
                currentParentNode.children.splice(currentParentNodeIndex, 1);
            }

            /** 3. add node to new group */
            const groupNode = gltf.data.nodes[groupIndex];
            if (!groupNode.children) groupNode.children = [];
            groupNode.children.push(nodeIndex);
        }

        gltf.data.scenes[0].nodes.push(groupIndex);

        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

const removeObject = entities => {
    /** we have to manually set this here or it will cause react errors when entities are removed */
    getMutableState(SelectionState).selectedEntities.set([]);

    const scenes = getSourcesForEntities(entities);

    for (const [sceneID, entities] of Object.entries(scenes)) {
        const uuidsToRemove = new Set(entities.map(entity => getComponent(entity, UUIDComponent)));
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
        const gltfData = gltf.data;

        const nodesToRemove = collectNodesToRemove(gltf.data, uuidsToRemove);
        removeNodes(gltfData, nodesToRemove);
        compactNodes(gltfData);

        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

const collectNodesToRemove = (gltfData, uuidsToRemove) => {
    const nodesToRemove = new Set();

    const collectDescendants = nodeIndex => {
        nodesToRemove.add(nodeIndex);
        const node = gltfData.nodes[nodeIndex];
        node.children?.forEach(collectDescendants);
    };

    gltfData.nodes.forEach((node, index) => {
        const nodeUUID = node.extensions?.[UUIDComponent.jsonID];
        if (uuidsToRemove.has(nodeUUID)) {
            collectDescendants(index);
        }
    });

    return nodesToRemove;
};

const removeNodes = (gltfData, nodesToRemove) => {
    for (let i = gltfData.nodes.length - 1; i >= 0; i--) {
        if (nodesToRemove.has(i)) {
            removeNodeReferences(gltfData, i);
            gltfData.nodes[i] = null;
        }
    }
};

// removes all references to a specific node from the gltfData
const removeNodeReferences = (gltfData, nodeIndex) => {
    gltfData.nodes.forEach(node => {
        if (node && node.children) {
            node.children = node.children.filter(childIndex => childIndex !== nodeIndex);
        }
    });
    gltfData.scenes[0].nodes = gltfData.scenes[0].nodes.filter(index => index !== nodeIndex);
};

// remove null nodes from the gltfData and update the indices of the remaining nodes
const compactNodes = gltfData => {
    let offset = 0;
    const oldToNewIndex = new Map();

    gltfData.nodes = gltfData.nodes.filter((node, i) => {
        if (node === null) {
            offset++;
            return false;
        }
        oldToNewIndex.set(i, i - offset);
        return true;
    });

    // update the node references in gltfData after some nodes have been removed
    updateNodeReferences(gltfData, oldToNewIndex);
};

// ensures that all references to node indices (both in parent-child relationships and in the scene's root nodes) are updated to reflect the new, compacted structure of the nodes array
const updateNodeReferences = (gltfData, oldToNewIndex) => {
    gltfData.nodes.forEach(node => {
        if (node.children) {
            node.children = node.children.map(childIndex => oldToNewIndex.get(childIndex));
        }
    });
    gltfData.scenes[0].nodes = gltfData.scenes[0].nodes.map(index => oldToNewIndex.get(index));
};

const replaceSelection = entities => {
    const current = getMutableState(SelectionState).selectedEntities.value;

    if (entities.length === current.length) {
        let same = true;
        for (let i = 0; i < entities.length; i++) {
            if (!current.includes(entities[i])) {
                same = false;
                break;
            }
        }
        if (same) return;
    }

    SelectionState.updateSelection(entities);
};

const toggleSelection = entities => {
    const selectedEntities = getMutableState(SelectionState).selectedEntities.value.slice(0);

    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const index = selectedEntities.indexOf(entity);

        if (index > -1) {
            selectedEntities.splice(index, 1);
        } else {
            selectedEntities.push(entity);
        }
    }

    SelectionState.updateSelection(entities);
};

const addToSelection = entities => {
    const selectedEntities = getMutableState(SelectionState).selectedEntities.value.slice(0);

    for (let i = 0; i < entities.length; i++) {
        const object = entities[i];
        if (selectedEntities.includes(object)) continue;
        selectedEntities.push(object);
    }

    SelectionState.updateSelection(entities);
};

const commitTransformSave = entities => {
    const scenes = getSourcesForEntities(entities);
    for (const sceneID of Object.keys(scenes)) {
        const gltf = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
        for (const entity of entities) {
            const entityUUID = getComponent(entity, UUIDComponent);
            const node = getGLTFNodeByUUID(gltf.data, entityUUID);
            if (!node) continue;
            const transform = getComponent(entity, TransformComponent);
            const position = transform.position;
            const rotation = transform.rotation;
            const scale = transform.scale;
            const matrix = tempMatrix4.compose(position, rotation, scale);
            node.matrix = matrix.toArray();
        }
        dispatchAction(GLTFSnapshotAction.createSnapshot(gltf));
    }
};

export const EditorControlFunctions = {
    addOrRemoveComponent,
    hasComponentInAuthoringLayer,
    modifyProperty,
    modifyName,
    modifyMaterial,
    createObjectFromSceneElement,
    duplicateObject,
    positionObject,
    rotateObject,
    rotateAround,
    scaleObject,
    reparentObject,
    groupObjects,
    removeObject,
    addToSelection,
    replaceSelection,
    toggleSelection,
    commitTransformSave,
    overwriteLookdevObject,
};
