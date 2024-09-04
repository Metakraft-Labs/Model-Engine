import { readInputFromSockets, writeOutputsToSocket } from "./NodeSockets";

export class Node {
    inputs;
    outputs;
    description;
    // typeName;
    nodeType;
    otherTypeNames;
    graph;
    label;
    metadata;
    configuration;

    constructor(node) {
        this.inputs = node.inputs;
        this.outputs = node.outputs;
        this.description = node.description;
        this.nodeType = node.nodeType;
        this.graph = node.graph;
        this.configuration = node.configuration;
        this.metadata = node.metadata || {};
    }

    readInput = inputName => {
        return readInputFromSockets(this.inputs, inputName, this.description.typeName);
    };

    writeOutput = (outputName, value) => {
        writeOutputsToSocket(this.outputs, outputName, value, this.description.typeName);
    };
}
