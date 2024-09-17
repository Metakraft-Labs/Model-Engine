export const createNode = ({ graph, registry, nodeTypeName, nodeConfiguration = {} }) => {
    const nodeDefinition = registry.nodes[nodeTypeName] ? registry.nodes[nodeTypeName] : undefined;
    if (nodeDefinition === undefined) {
        console.log("known nodes: " + Object.keys(registry.nodes).join(", "));
        throw new Error(`no registered node descriptions with the typeName ${nodeTypeName}`);
    }

    const node = nodeDefinition.nodeFactory(graph, nodeConfiguration);
    node.inputs.forEach(socket => {
        if (socket.valueTypeName !== "flow" && socket.value === undefined) {
            socket.value = registry.values[socket.valueTypeName]?.creator();
        }
    });

    return node;
};

export const makeGraphApi = ({ variables = {}, customEvents = {}, values, dependencies = {} }) => ({
    variables,
    customEvents,
    values,
    getDependency: id => {
        const result = dependencies[id];
        if (!result)
            console.error(
                `Dependency not found ${id}.  Did you register it? Existing dependencies: ${Object.keys(dependencies)}`,
            );
        return result;
    },
});
