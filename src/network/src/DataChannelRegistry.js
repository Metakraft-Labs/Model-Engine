import { defineState, getMutableState, getState, none } from "../../hyperflux";

export const DataChannelRegistryState = defineState({
    name: "ee.engine.network.mediasoup.DataChannelRegistryState",
    initial: {},
});

export const addDataChannelHandler = (dataChannelType, handler) => {
    if (!getState(DataChannelRegistryState)[dataChannelType]) {
        getMutableState(DataChannelRegistryState).merge({ [dataChannelType]: [] });
    }
    getState(DataChannelRegistryState)[dataChannelType].push(handler);
};

export const removeDataChannelHandler = (dataChannelType, handler) => {
    if (!getState(DataChannelRegistryState)[dataChannelType]) return;

    const index = getState(DataChannelRegistryState)[dataChannelType].indexOf(handler);
    if (index === -1) return;

    getState(DataChannelRegistryState)[dataChannelType].splice(index, 1);

    if (getState(DataChannelRegistryState)[dataChannelType].length === 0) {
        getMutableState(DataChannelRegistryState)[dataChannelType].set(none);
    }
};
