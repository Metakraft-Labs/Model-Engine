import {
    defineAction,
    defineState,
    getMutableState,
    getState,
    matches,
    none,
} from "../../hyperflux";

export class NetworkActions {
    static updatePeers = defineAction({
        type: "ee.engine.network.UPDATE_PEERS",
        peers: matches.array,
    });
}

export const NetworkState = defineState({
    name: "NetworkState",
    initial: {
        hostIds: {
            media,
            world,
        },
        // todo - move to Network.schemas
        networkSchema: {},
        networks: {},
        config: {
            /** Allow connections to a world instance server */
            world: false,
            /** Allow connections to a media instance server */
            media: false,
            /** Allow connections to channel media instances and friend functionality */
            friends: false,
            /** Use instance IDs in url */
            instanceID: false,
            /** Use room IDs in url */
            roomID: false,
        },
    },

    /** must be explicitly ordereds return keys in assignment order */
    get orderedNetworkSchema() {
        return Object.keys(getState(NetworkState).networkSchema)
            .sort()
            .map(key => getState(NetworkState).networkSchema[key]);
    },

    get worldNetwork() {
        const state = getState(NetworkState);
        return state.networks[state.hostIds.world];
    },

    get worldNetworkState() {
        return getMutableState(NetworkState).networks[getState(NetworkState).hostIds.world];
    },

    get mediaNetwork() {
        const state = getState(NetworkState);
        return state.networks[state.hostIds.media];
    },

    get mediaNetworkState() {
        return getMutableState(NetworkState).networks[getState(NetworkState).hostIds.media];
    },
});

export const webcamVideoDataChannelType = "ee.core.webcamVideo.dataChannel";
export const webcamAudioDataChannelType = "ee.core.webcamAudio.dataChannel";
export const screenshareVideoDataChannelType = "ee.core.screenshareVideo.dataChannel";
export const screenshareAudioDataChannelType = "ee.core.screenshareAudio.dataChannel";

export const SceneUser = "scene";

export const addNetwork = network => {
    getMutableState(NetworkState).networks[network.id].set(network);
};

export const removeNetwork = network => {
    getMutableState(NetworkState).networks[network.id].set(none);
};
