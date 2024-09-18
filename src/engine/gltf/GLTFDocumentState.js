import matches from "ts-matches";

import { UUIDComponent, getComponent, useOptionalComponent } from "../../ecs";
import {
    defineAction,
    defineState,
    getMutableState,
    getState,
    useHookstate,
} from "../../hyperflux";
import { SourceComponent } from "../scene/components/SourceComponent";

export const GLTFDocumentState = defineState({
    name: "ee.engine.gltf.GLTFDocumentState",
    initial: {},
});

export const GLTFNodeState = defineState({
    name: "ee.engine.gltf.GLTFNodeState",
    initial: {},

    getMutableNode(entity) {
        const source = getComponent(entity, SourceComponent);
        const uuid = getComponent(entity, UUIDComponent);
        if (!source || !uuid) {
            console.error(
                "GLTFNodeState.getMutableNode: entity does not have SourceComponent or UUIDComponent",
            );
        }
        const nodeLookup = getState(GLTFNodeState)[source][uuid];
        if (!nodeLookup) {
            console.error("GLTFNodeState.getMutableNode: node not found in lookup");
        }
        const gltf = getMutableState(GLTFDocumentState)[source];
        return gltf.nodes[nodeLookup.nodeIndex];
    },

    useMutableNode(entity) {
        try {
            const nodeState = useHookstate(getMutableState(GLTFNodeState));
            const source = useOptionalComponent(entity, SourceComponent)?.value;
            const uuid = useOptionalComponent(entity, UUIDComponent)?.value;

            if (!source || !uuid) {
                console.warn("useMutableNode: Missing source or UUID for entity", entity);
                return undefined;
            }

            const sourceNodes = nodeState.value[source];
            if (!sourceNodes) {
                console.warn(`useMutableNode: No nodes found for source "${source}"`);
                return undefined;
            }

            const nodeLookup = sourceNodes[uuid];
            if (!nodeLookup) {
                console.warn(`useMutableNode: No node lookup found for UUID "${uuid}"`);
                return undefined;
            }

            const gltfDocument = getState(GLTFDocumentState)[source];
            if (!gltfDocument || !gltfDocument.nodes) {
                console.warn(
                    `useMutableNode: No GLTF document or nodes found for source "${source}"`,
                );
                return undefined;
            }

            return gltfDocument.nodes[nodeLookup.nodeIndex];
        } catch (error) {
            console.error("Error in useMutableNode:", error);
            return undefined;
        }
    },

    convertGltfToNodeDictionary: gltf => {
        const nodes = {};

        const addNode = (nodeIndex, childIndex, parentUUID) => {
            const node = gltf.nodes[nodeIndex];
            const uuid = node.extensions?.[UUIDComponent.jsonID];
            if (uuid) {
                nodes[uuid] = { nodeIndex, childIndex, parentUUID };
            } else {
                /** @todo generate a globally deterministic UUID here */
                console.warn("Node does not have a UUID:", node);
                return;
            }
            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    addNode(node.children[i], i, uuid);
                }
            }
        };

        const scene = gltf.scenes[0];
        for (let i = 0; i < scene.nodes.length; i++) {
            const index = scene.nodes[i];
            addNode(index, i, null);
        }

        for (let i = 0; i < gltf.scenes[0].nodes.length; i++) {
            const nodeIndex = gltf.scenes[0].nodes[i];
            const node = gltf.nodes[nodeIndex];
            const uuid = node.extensions?.[UUIDComponent.jsonID];
            if (uuid) {
                nodes[uuid] = {
                    nodeIndex,
                    childIndex: i,
                    parentUUID,
                };
            } else {
                console.warn("Node does not have a UUID:", node);
            }
        }
        return nodes;
    },
});

export const GLTFModifiedState = defineState({
    name: "ee.engine.gltf.GLTFModifiedState",
    initial: {},
});

export class GLTFSnapshotAction {
    static createSnapshot = defineAction({
        type: "ee.gltf.snapshot.CREATE_SNAPSHOT",
        source: matches.string,
        data: matches.object,
    });

    static undo = defineAction({
        type: "ee.gltf.snapshot.UNDO",
        source: matches.string,
        count: matches.number,
    });

    static redo = defineAction({
        type: "ee.gltf.snapshot.REDO",
        source: matches.string,
        count: matches.number,
    });

    static clearHistory = defineAction({
        type: "ee.gltf.snapshot.CLEAR_HISTORY",
        source: matches.string,
    });

    static unload = defineAction({
        type: "ee.gltf.snapshot.UNLOAD",
        source: matches.string,
    });
}
