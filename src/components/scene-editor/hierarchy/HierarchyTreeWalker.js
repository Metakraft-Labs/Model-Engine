import { getComponent, hasComponent } from "../../../ecs/ComponentFunctions";
import { entityExists } from "../../../ecs/EntityFunctions";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { getState } from "../../../hyperflux";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";

import { UUIDComponent } from "../../../ecs";
import { GLTFSnapshotState } from "../../../engine/gltf/GLTFState";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { getModelSceneID } from "../../../engine/scene/functions/loaders/ModelFunctions";
import { EditorState } from "../services/EditorServices";

function isChild(index, nodes) {
    for (const node of nodes) {
        if (node.children && node.children.includes(index)) return true;
    }

    return false;
}

function buildHierarchyTree(
    depth,
    childIndex,
    node,
    nodes,
    array,
    lastChild,
    sceneID,
    showModelChildren,
) {
    const uuid = node.extensions && node.extensions[UUIDComponent.jsonID];
    const entity = UUIDComponent.getEntityByUUID(uuid);
    if (!entity || !entityExists(entity)) return;

    const item = {
        depth,
        childIndex,
        entity: entity,
        isCollapsed: !getState(EditorState).expandedNodes[sceneID]?.[entity],
        children: [],
        isLeaf: !(node.children && node.children.length > 0),
        lastChild: lastChild,
    };
    array.push(item);

    if (hasComponent(entity, ModelComponent) && showModelChildren) {
        const modelSceneID = getModelSceneID(entity);
        const snapshotState = getState(GLTFSnapshotState);
        const snapshots = snapshotState[modelSceneID];
        if (snapshots) {
            const snapshotNodes = snapshots.snapshots[snapshots.index].nodes;
            if (snapshotNodes && snapshotNodes.length > 0) {
                item.isLeaf = false;
                if (!item.isCollapsed)
                    buildHierarchyTreeForNodes(
                        depth + 1,
                        snapshotNodes,
                        item.children,
                        sceneID,
                        showModelChildren,
                    );
            }
        }
    }

    if (node.children && !item.isCollapsed) {
        for (let i = 0; i < node.children.length; i++) {
            const childIndex = node.children[i];
            buildHierarchyTree(
                depth + 1,
                i,
                nodes[childIndex],
                nodes,
                item.children,
                i === node.children.length - 1,
                sceneID,
                showModelChildren,
            );
        }
    }
}

function buildHierarchyTreeForNodes(depth, nodes, outArray, sceneID, showModelChildren) {
    for (let i = 0; i < nodes.length; i++) {
        if (isChild(i, nodes)) continue;
        buildHierarchyTree(depth, i, nodes[i], nodes, outArray, false, sceneID, showModelChildren);
    }
    if (!outArray.length) return;
    outArray[outArray.length - 1].lastChild = true;
}

function flattenTree(array, outArray) {
    for (const item of array) {
        if (!item.entity) continue;
        outArray.push({
            depth: item.depth,
            entity: item.entity,
            childIndex: item.childIndex,
            lastChild: item.lastChild,
            isLeaf: item.isLeaf,
            isCollapsed: item.isCollapsed,
        });
        flattenTree(item.children, outArray);
    }
}

export function gltfHierarchyTreeWalker(rootEntity, nodes, showModelChildren) {
    const outArray = [];

    const sceneID = getComponent(rootEntity, SourceComponent);
    const rootNode = {
        depth: 0,
        entity: rootEntity,
        childIndex: 0,
        lastChild: true,
        isCollapsed: !getState(EditorState).expandedNodes[sceneID]?.[rootEntity],
    };
    const tree = [rootNode];

    if (!rootNode.isCollapsed) {
        buildHierarchyTreeForNodes(1, nodes, outArray, sceneID, showModelChildren);
        flattenTree(outArray, tree);
    }

    return tree;
}

/**
 * treeWalker function used to handle tree.
 *
 * @param  {entityNode}    expandedNodes
 */

export function* hierarchyTreeWalker(sceneID, treeNode) {
    if (!treeNode) return;

    const stack = [];

    stack.push({ depth: 0, entity: treeNode, childIndex: 0, lastChild: true });

    while (stack.length !== 0) {
        const { depth, entity: entityNode, childIndex, lastChild } = stack.pop();

        if (!entityExists(entityNode) || !hasComponent(entityNode, SourceComponent)) continue;

        const expandedNodes = getState(EditorState).expandedNodes;

        const isCollapsed = !expandedNodes[sceneID]?.[entityNode];

        const entityTreeComponent = getComponent(entityNode, EntityTreeComponent);

        // treat entites with all helper children as leaf nodes
        const allhelperChildren = entityTreeComponent.children.every(
            child => !hasComponent(child, SourceComponent),
        );

        yield {
            isLeaf: entityTreeComponent.children.length === 0 || allhelperChildren,
            isCollapsed,
            depth,
            entity: entityNode,
            childIndex,
            lastChild,
        };

        if (entityTreeComponent.children.length !== 0 && !isCollapsed) {
            for (let i = entityTreeComponent.children.length - 1; i >= 0; i--) {
                const childEntity = entityTreeComponent.children[i];
                if (hasComponent(childEntity, SourceComponent)) {
                    stack.push({
                        depth: depth + 1,
                        entity: childEntity,
                        childIndex: i,
                        lastChild: i === 0,
                    });
                }
            }
        }
    }
}
