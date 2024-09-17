export const hasPositionMetaData = visualScript => {
    if (visualScript.nodes === undefined) return false;
    return visualScript.nodes.some(
        node => node.metadata?.positionX !== undefined || node.metadata?.positionY !== undefined,
    );
};
