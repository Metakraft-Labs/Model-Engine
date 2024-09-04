import { readInputFromSockets, writeOutputsToSocket } from "./NodeSockets";

export const NodeType = {
    Event: "Event",
    Flow: "Flow",
    Async: "Async",
    Function: "Function",
};

export const isFlowNode = node => node.nodeType === NodeType.Flow;

export const isEventNode = node => node.nodeType === NodeType.Event;

export const isAsyncNode = node => node.nodeType === NodeType.Async;

export const isFunctionNode = node => node.nodeType === NodeType.Function;

export const makeNodeInstance = node => {
    const readInput = inputName => {
        return readInputFromSockets(node.inputs, inputName, node.description.typeName);
    };

    const writeOutput = (outputName, value) => {
        writeOutputsToSocket(node.outputs, outputName, value, node.description.typeName);
    };

    return {
        ...node,
        readInput,
        writeOutput,
    };
};
