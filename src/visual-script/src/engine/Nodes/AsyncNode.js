import { Assert } from "../Diagnostics/Assert";
import { Node } from "./Node";
import { NodeType } from "./NodeInstance";

// async flow node with only a single flow input
export class AsyncNode extends Node {
    constructor(description, graph, inputs = [], outputs = [], configuration = {}) {
        super({
            description: {
                ...description,
                category: description.category,
            },
            inputs,
            outputs,
            graph,
            nodeType: NodeType.Async,
            configuration,
        });

        // must have at least one input flow socket
        Assert.mustBeTrue(this.inputs.some(socket => socket.valueTypeName === "flow"));

        // must have at least one output flow socket
        Assert.mustBeTrue(this.outputs.some(socket => socket.valueTypeName === "flow"));
    }

    triggered(engine, triggeringSocketName, finished) {
        throw new Error("not implemented");
    }

    dispose() {
        throw new Error("not implemented");
    }
}

export class AsyncNode2 extends AsyncNode {
    constructor(props) {
        super(props.description, props.graph, props.inputs, props.outputs);
    }
}

export class AsyncNodeInstance extends Node {
    triggeredInner;
    disposeInner;
    state;

    constructor(node) {
        super({ ...node, nodeType: NodeType.Async });

        this.triggeredInner = node.triggered;
        this.disposeInner = node.dispose;
        this.state = node.initialState;
    }

    triggered = (engine, triggeringSocketName, finished) => {
        this.triggeredInner({
            read: this.readInput,
            write: this.writeOutput,
            commit: (outFlowname, fiberCompletedListener) =>
                engine.commitToNewFiber(this, outFlowname, fiberCompletedListener),
            configuration: this.configuration,
            graph: this.graph,
            finished,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            triggeringSocketName,
        });
    };
    dispose = () => {
        this.state = this.disposeInner({ state: this.state, graph: this.graph });
    };
}
