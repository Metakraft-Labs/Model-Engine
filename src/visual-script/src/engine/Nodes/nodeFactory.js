import { Socket } from "../Sockets/Socket";
import { NodeCategory } from "./NodeDefinitions";

const makeSocketFromDefinition = (key, { valueType, defaultValue, choices }) =>
    new Socket(valueType, key, defaultValue, undefined, choices);

const makeSocketsFromMap = (socketConfig, keys, configuration, graphApi) => {
    return keys.map(key => {
        const definition = socketConfig[key];
        if (typeof definition === "string") {
            return new Socket(definition, key);
        }
        if (typeof definition === "function") {
            const socketDef = definition(configuration, graphApi);

            return makeSocketFromDefinition(key, socketDef);
        }
        return makeSocketFromDefinition(key, definition);
    });
};

const makeSocketsFromArray = sockets =>
    sockets.map(socket => {
        return new Socket(
            socket.valueType,
            socket.key,
            socket.defaultValue,
            undefined,
            socket.choices,
        );
    });

export function makeOrGenerateSockets(socketConfigOrFactory, nodeConfig, graph) {
    // if sockets definition is dynamic, then use the node config to generate it;
    // otherwise, use the static definition
    if (typeof socketConfigOrFactory === "function") {
        const socketsConfig = socketConfigOrFactory(nodeConfig, graph);

        return makeSocketsFromArray(socketsConfig);
    }

    return makeSocketsFromMap(
        socketConfigOrFactory,
        Object.keys(socketConfigOrFactory),
        nodeConfig,
        graph,
    );
}

export const makeCommonProps = (
    nodeType,
    {
        typeName,
        in: inputs,
        out,
        otherTypeNames = [],
        category = NodeCategory.None,
        configuration: nodeDefinitionConfiguration,
        helpDescription = "",
        label = "",
    },
    configuration,
    graph,
) => ({
    description: {
        typeName: typeName,
        configuration: nodeDefinitionConfiguration || {},
        category,
        otherTypeNames,
        helpDescription,
        label,
    },
    nodeType: nodeType,
    inputs: makeOrGenerateSockets(inputs, configuration, graph),
    outputs: makeOrGenerateSockets(out, configuration, graph),
    configuration,
    graph,
});
