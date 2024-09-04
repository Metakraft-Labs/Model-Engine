import { makeGraphApi } from "../Graphs/Graph";
import { makeOrGenerateSockets } from "./nodeFactory";

const makeEmptyGraph = () => {
    return makeGraphApi({
        dependencies: {},
        values: {},
    });
};

/** Helper function to test an function node's exec and get the resulting outputs.
 * Can simulate the input socket values. Returns the output socket values
 */
export const testExec = ({
    nodeInputVals = {},
    configuration = {},
    exec,
    makeGraph = makeEmptyGraph,
}) => {
    const outputs = {};

    exec({
        read: socketName => nodeInputVals[socketName],
        write: (outputValueName, value) => {
            outputs[outputValueName] = value;
        },
        configuration,
        graph: makeGraph(),
    });

    return outputs;
};

export const RecordedOutputType = {
    write: "write",
    commit: "commit",
};

/**
 * Generates a function that can be used to test the triggered function of a node.
 * The trigger function will maintain state between each invokation, and returns a list
 * the recorded outputs, including the commits to flow outputs.
 * @returns
 */
export const generateTriggerTester = (
    { triggered, initialState, out },
    configuration = {},
    makeGraph = makeEmptyGraph,
) => {
    let state = initialState;

    const graph = makeGraph();

    const outputSocketKeys = getOutputSocketKeys({
        outputs: out,
        config: configuration,
        graph,
    });

    /** Triggers the `triggered` function, and updates internal state. Returns a
     * list of the recorded outputs, including the commits to flow outputs.
     */
    const trigger = ({ inputVals = {}, triggeringSocketName }) => {
        const recordedOutputs = [];
        // call the triggered function with the current state and
        // simulated input vals, and udpate the state with the result.
        state = triggered({
            triggeringSocketName,
            read: socketName => inputVals[socketName],
            write: (outputValueName, value) => {
                recordedOutputs.push({
                    outputType: RecordedOutputType.write,
                    socketName: outputValueName,
                    value: value,
                });
            },
            commit: (outputFlowName, fiberCompletedListener) => {
                recordedOutputs.push({
                    outputType: RecordedOutputType.commit,
                    socketName: outputFlowName,
                });

                if (fiberCompletedListener) {
                    fiberCompletedListener();
                }
            },
            configuration,
            graph,
            state: state,
            finished: () => {
                return;
            },
            outputSocketKeys,
        });

        return recordedOutputs;
    };

    return trigger;
};
function getOutputSocketKeys({ outputs, config, graph }) {
    const sockets = makeOrGenerateSockets(outputs, config, graph);

    return sockets.map(x => x.name);
}
