export const isHandleConnected = (edges, nodeId, handleId, type) => {
    return edges.some(edge => edge[type] === nodeId && edge[`${type}Handle`] === handleId);
};
