import { v4 as uuidv4 } from "uuid";

export const visualToFlow = visualScript => {
    const nodes = [];
    const edges = [];

    visualScript.nodes?.forEach(nodeJSON => {
        const node = {
            id: nodeJSON.id,
            type: nodeJSON.type,
            position: {
                x: nodeJSON.metadata?.positionX ? Number(nodeJSON.metadata?.positionX) : 0,
                y: nodeJSON.metadata?.positionY ? Number(nodeJSON.metadata?.positionY) : 0,
            },
            data: {
                configuration: {},
                values: {},
            },
        };
        if (nodeJSON.metadata?.parentNode) {
            node.parentNode = nodeJSON.metadata.parentNode;
        }
        if (nodeJSON.metadata?.style) {
            node.style = nodeJSON.metadata.style;
        }
        if (nodeJSON.metadata?.label) {
            node.data.label = nodeJSON.metadata.label;
        }
        nodes.push(node);

        if (nodeJSON.configuration) {
            for (const [inputKey, input] of Object.entries(nodeJSON.configuration)) {
                node.data.configuration[inputKey] = input;
            }
        }

        if (nodeJSON.parameters) {
            for (const [inputKey, input] of Object.entries(nodeJSON.parameters)) {
                if ("link" in input && input.link !== undefined) {
                    edges.push({
                        id: uuidv4(),
                        source: input.link.nodeId,
                        sourceHandle: input.link.socket,
                        target: nodeJSON.id,
                        targetHandle: inputKey,
                    });
                }
                if ("value" in input) {
                    node.data.values[inputKey] = input.value;
                }
            }
        }

        if (nodeJSON.flows) {
            for (const [inputKey, link] of Object.entries(nodeJSON.flows)) {
                edges.push({
                    id: uuidv4(),
                    source: nodeJSON.id,
                    sourceHandle: inputKey,
                    target: link.nodeId,
                    targetHandle: link.socket,
                });
            }
        }
    });

    return [nodes, edges];
};
