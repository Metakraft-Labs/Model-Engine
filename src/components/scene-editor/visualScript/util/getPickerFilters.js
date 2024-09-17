import { getSocketsByNodeTypeAndHandleType } from "./getSocketsByNodeTypeAndHandleType";

export const getNodePickerFilters = (nodes, params, specGenerator) => {
    if (params === undefined) return;

    const originNode = nodes.find(node => node.id === params.nodeId);
    if (originNode === undefined) return;

    const sockets = specGenerator
        ? getSocketsByNodeTypeAndHandleType(
              specGenerator,
              originNode.type,
              originNode.data.configuration,
              params.handleType,
          )
        : undefined;

    const socket = sockets?.find(socket => socket.name === params.handleId);

    if (socket === undefined) return;

    return {
        handleType: params.handleType === "source" ? "target" : "source",
        valueType: socket.valueType,
    };
};
