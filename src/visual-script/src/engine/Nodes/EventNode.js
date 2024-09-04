import { Assert } from "../Diagnostics/Assert";
import { Node } from "./Node";
import { NodeType } from "./NodeInstance";

// no flow inputs, always evaluated on startup
export class EventNode extends Node {
    constructor(description, graph, inputs = [], outputs = [], configuration = {}) {
        super({
            ...description,
            description: {
                ...description,
                category: description.category,
            },
            inputs,
            outputs,
            graph,
            configuration,
            nodeType: NodeType.Event,
        });
        // no input flow sockets allowed.
        Assert.mustBeTrue(!this.inputs.some(socket => socket.valueTypeName === "flow"));

        // must have at least one output flow socket
        Assert.mustBeTrue(this.outputs.some(socket => socket.valueTypeName === "flow"));
    }

    init(engine) {
        throw new Error("not implemented");
    }

    dispose(engine) {
        throw new Error("not implemented");
    }
}

export class EventNode2 extends EventNode {
    constructor(props) {
        super(props.description, props.graph, props.inputs, props.outputs, props.configuration);
    }
}

export class EventNodeInstance extends Node {
    initInner;
    disposeInner;
    state;
    outputSocketKeys;

    constructor(nodeProps) {
        super({ ...nodeProps, nodeType: NodeType.Event });
        this.initInner = nodeProps.init;
        this.disposeInner = nodeProps.dispose;
        this.state = nodeProps.initialState;
        this.outputSocketKeys = nodeProps.outputs.map(s => s.name);
    }

    init = engine => {
        this.state = this.initInner({
            read: this.readInput,
            write: this.writeOutput,
            state: this.state,
            outputSocketKeys: this.outputSocketKeys,
            commit: (outFlowname, fiberCompletedListener) => {
                engine.commitToNewFiber(this, outFlowname, fiberCompletedListener);
                engine.executeAllSync(1);
            },
            configuration: this.configuration,
            graph: this.graph,
        });
    };

    dispose() {
        this.disposeInner({
            state: this.state,
            graph: this.graph,
        });
    }
}
