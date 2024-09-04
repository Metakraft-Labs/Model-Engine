export const readInputFromSockets = (inputs, inputName, nodeTypeName) => {
    const inputSocket = inputs.find(socket => socket.name === inputName);
    if (inputSocket === undefined) {
        throw new Error(
            `can not find input socket with name ${inputName} on node of type ${nodeTypeName}`,
        );
    }
    return inputSocket.value;
};

export const writeOutputsToSocket = (outputs, outputName, value, nodeTypeName) => {
    const outputSocket = outputs.find(socket => socket.name === outputName);
    if (outputSocket === undefined) {
        throw new Error(
            `can not find output socket with name ${outputName} on node of type ${nodeTypeName}`,
        );
    }
    outputSocket.value = value;
};
